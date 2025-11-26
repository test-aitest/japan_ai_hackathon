"use server";

import { Keyword } from "@/lib/types";

/**
 * Translate text using OpenAI API with streaming
 */
export async function translateTextStreaming(
  text: string,
  sourceLang: string,
  targetLang: string,
  keywords?: Keyword[]
): Promise<ReadableStream<Uint8Array>> {
  console.log("[Server] translateTextStreaming called with:", { text, sourceLang, targetLang });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!text.trim()) {
    // Return empty stream
    return new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
  }

  let systemPrompt = `Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text, without any explanations or additional comments.`;

  // Add custom keywords to the prompt if provided
  if (keywords && keywords.length > 0) {
    const keywordList = keywords
      .map((k) => `- "${k.term}" should be translated as "${k.translation}"`)
      .join("\n");
    systemPrompt += `\n\nIMPORTANT: Use these custom translations for specific terms:\n${keywordList}`;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Server] OpenAI API error:", errorText);
    throw new Error(`Translation failed: ${response.statusText}`);
  }

  return response.body!;
}

/**
 * Translate text using OpenAI API (non-streaming, for backward compatibility)
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  keywords?: Keyword[]
): Promise<{ translatedText: string }> {
  console.log("[Server] translateText called with:", { text, sourceLang, targetLang, keywords });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("[Server] OPENAI_API_KEY is not configured");
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!text.trim()) {
    console.log("[Server] Empty text, returning empty string");
    return { translatedText: "" };
  }

  let systemPrompt = `Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text, without any explanations or additional comments.`;

  // Add custom keywords to the prompt if provided
  if (keywords && keywords.length > 0) {
    const keywordList = keywords
      .map((k) => `- "${k.term}" should be translated as "${k.translation}"`)
      .join("\n");
    systemPrompt += `\n\nIMPORTANT: Use these custom translations for specific terms:\n${keywordList}`;
  }

  console.log("[Server] System prompt:", systemPrompt);

  try {
    console.log("[Server] Sending request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: systemPrompt,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
      }),
    });

    console.log("[Server] OpenAI API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Server] OpenAI API error:", errorText);
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[Server] OpenAI API response data:", data);
    const translatedText = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("[Server] Translated text:", translatedText);
    return { translatedText };
  } catch (error) {
    console.error("[Server] Error translating text:", error);
    throw new Error("Failed to translate text");
  }
}
