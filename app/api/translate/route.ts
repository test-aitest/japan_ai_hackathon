import { NextRequest } from "next/server";
import { Keyword } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response("OPENAI_API_KEY is not configured", { status: 500 });
  }

  const body = await request.json();
  const { text, sourceLang, targetLang, keywords } = body as {
    text: string;
    sourceLang: string;
    targetLang: string;
    keywords?: Keyword[];
  };

  if (!text.trim()) {
    return new Response("", { status: 200 });
  }

  let systemPrompt = `Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text, without any explanations or additional comments.`;

  if (keywords && keywords.length > 0) {
    const keywordList = keywords
      .map((k) => `- "${k.term}" should be translated as "${k.translation}"`)
      .join("\n");
    systemPrompt += `\n\nIMPORTANT: Use these custom translations for specific terms:\n${keywordList}`;
  }

  console.log("[API] Starting streaming translation for:", text);

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
    console.error("[API] OpenAI API error:", errorText);
    return new Response(`Translation failed: ${response.statusText}`, {
      status: 500,
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
