"use server";

import { Keyword } from "@/lib/types";

type ExtractedKeyword = {
  term: string;
  translation: string;
  category: string; // "speaker", "company", "product", "keyword", "technical"
};

/**
 * Extract keywords from a conference website URL
 */
export async function extractKeywordsFromURL(
  url: string,
  sourceLang: string,
  targetLang: string
): Promise<{ keywords: Omit<Keyword, "id">[]; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { keywords: [], error: "OPENAI_API_KEY is not configured" };
  }

  try {
    // Fetch the website content
    const response = await fetch(url);
    if (!response.ok) {
      return {
        keywords: [],
        error: `Failed to fetch URL: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Clean HTML and extract text - improved approach
    let text = html
      // Remove script and style tags with their content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove all HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Take more content for better extraction
    text = text.substring(0, 20000); // Increased from 15000

    if (!text.trim()) {
      return { keywords: [], error: "No text content found on the page" };
    }

    console.log("Extracted text length:", text.length);
    console.log("Text preview:", text.substring(0, 500));

    // Extract keywords using OpenAI
    const extractionPrompt = `Analyze the following conference website content and extract important proper nouns and technical terms.

Extract ALL of the following:
- Speaker names (people presenting or organizing)
- Company/organization names
- Product or service names
- Important session keywords or topics
- Technical terms or jargon
- Conference or event names

For each term, keep it in its original form (don't translate).

You MUST return a JSON object with a "keywords" array containing at least 10-20 terms if available.

Required JSON format:
{
  "keywords": [
    {"term": "John Doe", "translation": "John Doe", "category": "speaker"},
    {"term": "TechCorp", "translation": "TechCorp", "category": "company"},
    {"term": "Machine Learning", "translation": "Machine Learning", "category": "technical"}
  ]
}

Conference content:
${text}`;

    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that extracts proper nouns and technical terms from conference websites. You MUST always return a valid JSON object with a 'keywords' array. Extract as many relevant terms as possible (aim for 10-20+). Never return an empty array.",
            },
            {
              role: "user",
              content: extractionPrompt,
            },
          ],
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", errorText);
      return {
        keywords: [],
        error: `AI extraction failed: ${aiResponse.statusText}`,
      };
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response content:", content);

    if (!content) {
      return { keywords: [], error: "No content received from AI" };
    }

    let extractedKeywords: ExtractedKeyword[];
    try {
      const parsed = JSON.parse(content);
      console.log("Parsed JSON:", parsed);

      // Handle both array format and object with array property
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

    // Convert to Keyword format
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
