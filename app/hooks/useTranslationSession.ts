"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LogItem, SessionStatus, LanguagePair } from "@/lib/types";
import { getLanguageByCode } from "@/lib/languages";
import {
  getKeywordsForLanguagePair,
  applyKeywords,
} from "@/lib/keywordStorage";

// Simple type definitions for Web Speech API
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

  // Start streaming translation
  const startTranslation = useCallback(
    async (text: string, logId: string) => {
      // Cancel existing translation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const sourceLang = getLanguageByCode(languages.source);
      const targetLang = getLanguageByCode(languages.target);

      if (!sourceLang || !targetLang) return;

      // Get custom keywords for this language pair
      const keywords = getKeywordsForLanguagePair(
        languages.source,
        languages.target
      );

      console.log("[Client] Starting streaming translation for:", text);
      setStatus("translating");

      // Create new abort controller for this request
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  translatedText += content;
                  console.log("[Client] Received chunk:", content);
                  // Update log with incremental translation
                  setLogs((prev) =>
                    prev.map((log) =>
                      log.id === logId
                        ? { ...log, translated: translatedText }
                        : log
                    )
                  );
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        console.log("[Client] Streaming translation complete:", translatedText);

        // Mark as final
        setLogs((prev) =>
          prev.map((log) =>
            log.id === logId ? { ...log, isFinal: true } : log
          )
        );
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

  // Start recording session
  const startRecording = useCallback(async () => {
    try {
      setStatus("connecting");

      // Check if browser supports Speech Recognition
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

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sourceLang.speechRecognitionCode;
      recognition.maxAlternatives = 1;

      // Handle results
      recognition.onresult = async (event: SpeechRecognitionResultEvent) => {
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

        // Apply custom keywords to recognized text
        if (interimTranscript) {
          interimTranscript = applyKeywords(interimTranscript);
        }
        if (finalTranscript) {
          finalTranscript = applyKeywords(finalTranscript);
        }

        // Handle interim results (partial transcript)
        if (interimTranscript) {
          currentTranscriptRef.current = interimTranscript;

          if (currentLogIdRef.current) {
            // Update existing log item
            setLogs((prev) =>
              prev.map((log) =>
                log.id === currentLogIdRef.current
                  ? { ...log, original: interimTranscript }
                  : log
              )
            );
          } else {
            // Create new log item
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

          // Start translation with debounce (300ms)
          if (translationTimerRef.current) {
            clearTimeout(translationTimerRef.current);
          }

          const logId = currentLogIdRef.current;
          translationTimerRef.current = setTimeout(() => {
            if (logId) {
              startTranslation(interimTranscript, logId);
            }
          }, 300);
        }

        // Handle final results
        if (finalTranscript) {
          const finalText = finalTranscript.trim();

          if (finalText) {
            // Clear debounce timer
            if (translationTimerRef.current) {
              clearTimeout(translationTimerRef.current);
              translationTimerRef.current = null;
            }

            // Save the current log ID before it changes
            const logIdToUpdate = currentLogIdRef.current;

            if (logIdToUpdate) {
              // Update log with final original text
              setLogs((prev) =>
                prev.map((log) =>
                  log.id === logIdToUpdate
                    ? { ...log, original: finalText }
                    : log
                )
              );

              // Start final translation immediately
              startTranslation(finalText, logIdToUpdate);

              // Reset current transcript for next input
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
        // If still recording, restart recognition
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

      // Start recognition
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

  // Stop recording session
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Clear debounce timer
    if (translationTimerRef.current) {
      clearTimeout(translationTimerRef.current);
      translationTimerRef.current = null;
    }

    // Cancel ongoing translation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    currentTranscriptRef.current = "";
    currentLogIdRef.current = null;
    setIsRecording(false);
    setStatus("idle");
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Reset logs
  const resetLogs = useCallback(() => {
    setLogs([]);
    currentTranscriptRef.current = "";
    currentLogIdRef.current = null;
  }, []);

  // Cleanup on unmount
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
