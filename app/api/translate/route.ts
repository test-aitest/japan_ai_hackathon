import { NextRequest } from "next/server";
import { Keyword } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const apiKey = process.env.JAPAN_AI_STUDIO_API_KEY;

  if (!apiKey) {
    return new Response("JAPAN_AI_STUDIO_API_KEY is not configured", {
      status: 500,
    });
  }
  console.log("[API] Starting translation for:", request.url);

  const body = await request.json();
  const { text, sourceLang, targetLang, keywords } = body as {
    text: string;
    sourceLang: string;
    targetLang: string;
    keywords?: Keyword[];
  };

  console.log("[API] Translating:", text);

  if (!text.trim()) {
    return new Response("", { status: 200 });
  }

  let systemPrompt = `You are a translator. Translate the input text from ${sourceLang} to ${targetLang}. Return ONLY the translated text itself, with no additional explanations, comments, notes, or formatting. Do not include phrases like "Here is the translation:" or any other preamble.`;

  if (keywords && keywords.length > 0) {
    const keywordList = keywords
      .map((k) => `- "${k.term}" should be translated as "${k.translation}"`)
      .join("\n");
    systemPrompt += `\n\nIMPORTANT: Use these custom translations for specific terms:\n${keywordList}`;
  }

  console.log("[API] Starting streaming translation for:", text);

  // JAPAN AI Chat API v2仕様に基づく
  // 参照: https://api.japan-ai.co.jp/chat/v2
  const response = await fetch("https://api.japan-ai.co.jp/chat/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: text,
      systemPrompt: systemPrompt,
      model: "gpt-4o-mini",
      temperature: 0.3,
      stream: true,
      agentName: "",
    }),
  });

  console.log("[API] Streaming response:", response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[API] JAPAN AI API error:", errorText);
    return new Response(`Translation failed: ${response.statusText}`, {
      status: 500,
    });
  }

  // JAPAN AI APIのストリーミングレスポンスをそのまま返す
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
