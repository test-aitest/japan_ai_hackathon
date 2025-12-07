"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/translator/LanguageSelector";
import { TranslationLog } from "@/components/translator/TranslationLog";
import { RecordingButton } from "@/components/translator/RecordingButton";
import { KeywordSettings } from "@/components/translator/KeywordSettings";
import { QuestionGenerator } from "@/components/translator/QuestionGenerator";
import { useTranslationSession } from "@/app/hooks/useTranslationSession";
import { RotateCcw } from "lucide-react";

export default function Home() {
  const [sourceLang, setSourceLang] = useState("ja");
  const [targetLang, setTargetLang] = useState("en");

  const { logs, status, isRecording, toggleRecording, resetLogs } =
    useTranslationSession({
      source: sourceLang,
      target: targetLang,
    });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Language Selection */}
      <div className="px-6 py-3 border-b">
        <div className="flex items-center justify-between max-w-full">
          <h1 className="text-2xl font-bold tracking-tight">ConferSense AI</h1>
          <div className="flex items-center gap-3">
            <RecordingButton
              isRecording={isRecording}
              status={status}
              onToggle={toggleRecording}
            />
            <Card className="p-2">
              <LanguageSelector
                sourceLang={sourceLang}
                targetLang={targetLang}
                onSourceChange={setSourceLang}
                onTargetChange={setTargetLang}
                disabled={isRecording}
              />
            </Card>
            <KeywordSettings />
            <Button
              variant="ghost"
              size="icon"
              onClick={resetLogs}
              disabled={isRecording || logs.length === 0}
              className="w-9 h-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex-1 flex gap-4 min-h-0 px-6 py-4">
        {/* Left Column - Translation Log */}
        <div className="flex-1 flex flex-col min-h-0">
          <h2 className="text-sm font-medium mb-2">Translations</h2>
          <Card className="flex-1 overflow-hidden">
            <TranslationLog logs={logs} />
          </Card>
        </div>

        {/* Right Column - Question Generator */}
        <div className="w-96 flex flex-col min-h-0">
          <QuestionGenerator
            logs={logs}
            isRecording={isRecording}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        </div>
      </div>
    </div>
  );
}
