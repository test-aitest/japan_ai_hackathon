"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/translator/LanguageSelector";
import { TranslationLog } from "@/components/translator/TranslationLog";
import { RecordingButton } from "@/components/translator/RecordingButton";
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Hanasu</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Language Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Languages</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetLogs}
                disabled={isRecording || logs.length === 0}
                className="h-8"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            <Card className="p-4">
              <LanguageSelector
                sourceLang={sourceLang}
                targetLang={targetLang}
                onSourceChange={setSourceLang}
                onTargetChange={setTargetLang}
                disabled={isRecording}
              />
            </Card>
          </div>

          {/* Recording Button */}
          <div className="flex justify-center py-4">
            <RecordingButton
              isRecording={isRecording}
              status={status}
              onToggle={toggleRecording}
            />
          </div>

          {/* Translation Log */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium">Translations</h2>
            <Card className="min-h-[400px] max-h-[600px] overflow-hidden">
              <TranslationLog logs={logs} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
