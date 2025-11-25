"use server";

/**
 * Translate text using OpenAI API
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!text.trim()) {
    return { translatedText: "" };
  }

  const systemPrompt = `Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text, without any explanations or additional comments.`;

  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim() || "";

    return { translatedText };
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Failed to translate text");
  }
}
