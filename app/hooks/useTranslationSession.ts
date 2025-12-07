"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LogItem, SessionStatus, LanguagePair } from "@/lib/types";
import { getLanguageByCode } from "@/lib/languages";
import {
  getKeywordsForLanguagePair,
  applyKeywords,
} from "@/lib/keywordStorage";

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      isFinal: boolean;
      [key: number]: { transcript: string };
    };
  };
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionResultEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognitionType;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognitionType;
    };
  }
}

export function useTranslationSession(languages: LanguagePair) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<string>("");
  const currentLogIdRef = useRef<string | null>(null);
  const translationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startTranslation = useCallback(
    async (text: string, logId: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const sourceLang = getLanguageByCode(languages.source);
      const targetLang = getLanguageByCode(languages.target);

      if (!sourceLang || !targetLang) return;

      const keywords = getKeywordsForLanguagePair(
        languages.source,
        languages.target
      );

      setStatus("translating");

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            sourceLang: sourceLang.translationName,
            targetLang: targetLang.translationName,
            keywords,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let translatedText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // 最後の行は不完全な可能性があるので保持
          buffer = lines.pop() || "";

          for (const line of lines) {
            console.log("[Client] Received line:", line);
            if (line.trim() && line.startsWith("data: ")) {
              const jsonStr = line.slice(6); // "data: " を除去

              // [DONE] シグナルをスキップ
              if (jsonStr.trim() === "[DONE]") {
                console.log("[Client] Stream done");
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                console.log("[Client] Parsed data:", parsed);
                // JAPAN AI APIのストリーミング形式: type="delta", delta.text にテキストが含まれる
                if (parsed.type === "delta" && parsed.delta?.type === "text" && parsed.delta?.text) {
                  translatedText += parsed.delta.text;
                  console.log("[Client] Updated translation:", translatedText);
                  setLogs((prev) =>
                    prev.map((log) =>
                      log.id === logId
                        ? { ...log, translated: translatedText }
                        : log
                    )
                  );
                }
              } catch (e) {
                console.error("[Client] JSON parse error:", e, "Line:", line);
              }
            }
          }
        }

        // バッファに残っているデータを処理
        if (buffer.trim() && buffer.startsWith("data: ")) {
          const jsonStr = buffer.slice(6); // "data: " を除去

          // [DONE] シグナルをスキップ
          if (jsonStr.trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(jsonStr);
              console.log("[Client] Final parsed data:", parsed);
              if (parsed.type === "delta" && parsed.delta?.type === "text" && parsed.delta?.text) {
                translatedText += parsed.delta.text;
                setLogs((prev) =>
                  prev.map((log) =>
                    log.id === logId
                      ? { ...log, translated: translatedText }
                      : log
                  )
                );
              }
            } catch (e) {
              console.error("[Client] Final JSON parse error:", e, "Buffer:", buffer);
            }
          }
        }

        setStatus("listening");
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[Client] Translation aborted");
          return;
        }
        console.error("[Client] Translation error:", error);
        setLogs((prev) =>
          prev.map((log) =>
            log.id === logId
              ? { ...log, translated: "[Translation Error]", isFinal: true }
              : log
          )
        );
        setStatus("listening");
      }
    },
    [languages]
  );

  const startRecording = useCallback(async () => {
    try {
      setStatus("connecting");

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error(
          "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
        );
      }

      const sourceLang = getLanguageByCode(languages.source);
      if (!sourceLang) {
        throw new Error("Invalid source language");
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sourceLang.speechRecognitionCode;
      recognition.maxAlternatives = 1;

      recognition.onresult = async (event: SpeechRecognitionResultEvent) => {
        if (!isRecordingRef.current) {
          return;
        }

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          interimTranscript = applyKeywords(interimTranscript);
        }
        if (finalTranscript) {
          finalTranscript = applyKeywords(finalTranscript);
        }

        if (interimTranscript) {
          currentTranscriptRef.current = interimTranscript;

          if (currentLogIdRef.current) {
            setLogs((prev) =>
              prev.map((log) =>
                log.id === currentLogIdRef.current
                  ? { ...log, original: interimTranscript }
                  : log
              )
            );
          } else {
            const newLogId = `log-${Date.now()}`;
            currentLogIdRef.current = newLogId;
            const newLog: LogItem = {
              id: newLogId,
              original: interimTranscript,
              translated: "",
              isFinal: false,
              timestamp: Date.now(),
            };
            setLogs((prev) => [...prev, newLog]);
          }

          if (translationTimerRef.current) {
            clearTimeout(translationTimerRef.current);
          }
        }

        if (finalTranscript) {
          const finalText = finalTranscript.trim();

          if (finalText) {
            if (translationTimerRef.current) {
              clearTimeout(translationTimerRef.current);
              translationTimerRef.current = null;
            }

            const logIdToUpdate = currentLogIdRef.current;

            if (logIdToUpdate) {
              setLogs((prev) =>
                prev.map((log) =>
                  log.id === logIdToUpdate
                    ? { ...log, original: finalText, isFinal: true }
                    : log
                )
              );

              startTranslation(finalText, logIdToUpdate);

              currentTranscriptRef.current = "";
              currentLogIdRef.current = null;
            }
          }
        }
      };

      recognition.onstart = () => {
        setStatus("listening");
        setIsRecording(true);
        isRecordingRef.current = true;
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "no-speech") {
          // No speech detected, just continue
          return;
        }

        if (event.error === "not-allowed") {
          setStatus("error");
          setIsRecording(false);
          isRecordingRef.current = false;
          alert(
            "Microphone access was denied. Please allow microphone access in your browser settings."
          );
        } else {
          setStatus("error");
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Error restarting recognition:", error);
          }
        } else {
          setStatus("idle");
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };

      recognition.start();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setStatus("error");
      setIsRecording(false);
      isRecordingRef.current = false;
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }, [languages.source, startTranslation]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (translationTimerRef.current) {
      clearTimeout(translationTimerRef.current);
      translationTimerRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    currentTranscriptRef.current = "";
    currentLogIdRef.current = null;
    setIsRecording(false);
    setStatus("idle");
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetLogs = useCallback(() => {
    setLogs([]);
    currentTranscriptRef.current = "";
    currentLogIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (translationTimerRef.current) {
        clearTimeout(translationTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    logs,
    status,
    isRecording,
    toggleRecording,
    resetLogs,
  };
}
