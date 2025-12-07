import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const apiKey = process.env.JAPAN_AI_STUDIO_API_KEY;

  if (!apiKey) {
    return new Response("JAPAN_AI_STUDIO_API_KEY is not configured", {
      status: 500,
    });
  }

  const body = await request.json();
  const { translatedText, conferenceUrl, targetLang } = body as {
    translatedText: string;
    conferenceUrl: string | null;
    sourceLang: string;
    targetLang: string;
  };

  if (!translatedText.trim()) {
    return new Response("No text provided", { status: 400 });
  }

  // 質問生成用のプロンプトを構築
  const systemPrompt = `あなたは会議やカンファレンスで質問を作成するアシスタントです。
ユーザーが話した内容（翻訳済み）をもとに、会議やカンファレンスで聞くべき適切な質問を生成してください。

質問は以下の条件を満たすようにしてください：
- 明確で具体的である
- 会議やカンファレンスの文脈に適している
- プロフェッショナルで丁寧な表現
- ${targetLang}で出力する
- 1〜3個の質問を生成する`;

  let userPrompt = `以下は私が話した内容です（翻訳済み）：

${translatedText}`;

  if (conferenceUrl && conferenceUrl.trim()) {
    userPrompt += `\n\nカンファレンスのURL: ${conferenceUrl}\n\nこのURLの内容も考慮して、関連する質問を生成してください。`;
  }

  userPrompt += `\n\n上記の内容をもとに、会議やカンファレンスで質問できる内容を${targetLang}で生成してください。`;

  console.log("[API] Generating question with prompt:", userPrompt);

  // JAPAN AI Chat API v2を使用
  const response = await fetch("https://api.japan-ai.co.jp/chat/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: userPrompt,
      systemPrompt: systemPrompt,
      model: "gpt-4o-mini",
      temperature: 0.7,
      stream: true,
      agentName: "",
    }),
  });

  console.log("[API] Question generation response:", response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[API] JAPAN AI API error:", errorText);
    return new Response(`Question generation failed: ${response.statusText}`, {
      status: 500,
    });
  }

  // ストリーミングレスポンスをそのまま返す
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
