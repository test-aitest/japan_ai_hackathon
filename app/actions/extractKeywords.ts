"use server";

import { Keyword } from "@/lib/types";

type ExtractedKeyword = {
  term: string;
  translation: string;
  category: string;
};

export async function extractKeywordsFromURL(
  url: string,
  sourceLang: string,
  targetLang: string
): Promise<{ keywords: Omit<Keyword, "id">[]; error?: string }> {
  const apiKey = process.env.JAPAN_AI_STUDIO_API_KEY;

  if (!apiKey) {
    return { keywords: [], error: "JAPAN_AI_STUDIO_API_KEY is not configured" };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        keywords: [],
        error: `Failed to fetch URL: ${response.statusText}`,
      };
    }

    const html = await response.text();

    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    text = text.substring(0, 20000);

    if (!text.trim()) {
      return { keywords: [], error: "No text content found on the page" };
    }

    const systemPrompt = "Extract keywords from text and return them as JSON.";

    const extractionPrompt = `Extract speaker names, company names, product names, and technical terms from this text.

Return JSON in this format:
{"keywords":[{"term":"example","translation":"example","category":"speaker"}]}

Text:
${text}`;

    // JAPAN AI Chat API v2仕様に基づく
    // 参照: https://api.japan-ai.co.jp/chat/v2
    const aiResponse = await fetch(
      "https://api.japan-ai.co.jp/chat/v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: extractionPrompt,
          systemPrompt: systemPrompt,
          model: "gpt-4o-mini",
          temperature: 0.1,
          stream: false,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("JAPAN AI API error:", errorText);
      return {
        keywords: [],
        error: `AI extraction failed: ${aiResponse.statusText}`,
      };
    }

    const data = await aiResponse.json();
    console.log("AI Response data:", JSON.stringify(data, null, 2));

    // JAPAN AI APIのレスポンス形式: { status: "succeeded", chatMessage: "..." }
    const content = data.chatMessage;

    if (!content) {
      console.error("No chatMessage in response:", data);
      return { keywords: [], error: "No content received from AI" };
    }

    let extractedKeywords: ExtractedKeyword[];
    try {
      // マークダウンコードブロックや余分なテキストを除去
      let cleanedContent = content.trim();

      // ```json ... ``` の形式を除去
      const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        cleanedContent = codeBlockMatch[1];
      }

      // 最初の { から最後の } までを抽出
      const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[1];
      }

      const parsed = JSON.parse(cleanedContent);
      console.log("Parsed JSON:", parsed);

      extractedKeywords = Array.isArray(parsed)
        ? parsed
        : parsed.keywords || [];

      console.log("Extracted keywords count:", extractedKeywords.length);
    } catch (e) {
      console.error("Failed to parse AI response:", content, e);
      return { keywords: [], error: "Failed to parse AI response" };
    }

    if (extractedKeywords.length === 0) {
      console.error("No keywords extracted from:", content);
      return { keywords: [], error: "No keywords found in the content" };
    }

    const keywords: Omit<Keyword, "id">[] = extractedKeywords.map((kw) => ({
      term: kw.term,
      translation: kw.translation,
      sourceLang,
      targetLang,
    }));

    return { keywords };
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return {
      keywords: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
