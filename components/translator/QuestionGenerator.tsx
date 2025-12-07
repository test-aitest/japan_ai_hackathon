"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Loader2, MessageSquarePlus } from "lucide-react";
import { LogItem } from "@/lib/types";

type QuestionGeneratorProps = {
  logs: LogItem[];
  isRecording: boolean;
  sourceLang: string;
  targetLang: string;
};

export function QuestionGenerator({
  logs,
  isRecording,
  sourceLang,
  targetLang,
}: QuestionGeneratorProps) {
  const [conferenceUrl, setConferenceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 翻訳済みのテキストを全て結合
  const getTranslatedText = () => {
    return logs
      .filter((log) => log.translated && log.translated.trim() !== "")
      .map((log) => log.translated)
      .join(" ");
  };

  const handleGenerateQuestion = async () => {
    const translatedText = getTranslatedText();

    if (!translatedText.trim()) {
      setError("翻訳されたテキストがありません。先に録音してください。");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedQuestion("");

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          translatedText,
          conferenceUrl: conferenceUrl.trim() || null,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate question: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let questionText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            const jsonStr = line.slice(6);

            if (jsonStr.trim() === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              if (
                parsed.type === "delta" &&
                parsed.delta?.type === "text" &&
                parsed.delta?.text
              ) {
                questionText += parsed.delta.text;
                setGeneratedQuestion(questionText);
              }
            } catch (e) {
              console.error("JSON parse error:", e);
            }
          }
        }
      }

      // バッファに残っているデータを処理
      if (buffer.trim() && buffer.startsWith("data: ")) {
        const jsonStr = buffer.slice(6);

        if (jsonStr.trim() !== "[DONE]") {
          try {
            const parsed = JSON.parse(jsonStr);
            if (
              parsed.type === "delta" &&
              parsed.delta?.type === "text" &&
              parsed.delta?.text
            ) {
              questionText += parsed.delta.text;
              setGeneratedQuestion(questionText);
            }
          } catch (e) {
            console.error("Final JSON parse error:", e);
          }
        }
      }
    } catch (err) {
      setError("質問生成に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const translatedText = getTranslatedText();

  return (
    <Card className="p-4">
      <h2 className="text-lg font-bold mb-3">質問を生成</h2>
      <p className="text-xs text-muted-foreground mb-4">
        録音停止後、翻訳されたテキストとカンファレンスURLをもとに質問を生成します。
      </p>

      <div className="space-y-4">
        {/* カンファレンスURL入力 */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            カンファレンスURL（オプション）
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://conference.com"
                value={conferenceUrl}
                onChange={(e) => setConferenceUrl(e.target.value)}
                disabled={loading || isRecording}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* 翻訳済みテキストプレビュー */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            翻訳済みテキスト
          </label>
          <div className="max-h-32 overflow-y-auto p-3 bg-muted/50 rounded-md border text-sm">
            {translatedText || "まだ翻訳されたテキストがありません"}
          </div>
        </div>

        {/* 質問生成ボタン */}
        <Button
          onClick={handleGenerateQuestion}
          disabled={loading || isRecording || !translatedText.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              質問を生成中...
            </>
          ) : (
            <>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              質問を生成
            </>
          )}
        </Button>

        {/* エラーメッセージ */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 生成された質問 */}
        {generatedQuestion && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              生成された質問
            </label>
            <div className="max-h-64 overflow-y-auto p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{generatedQuestion}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
