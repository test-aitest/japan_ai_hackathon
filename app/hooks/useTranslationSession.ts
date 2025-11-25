"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LogItem, SessionStatus, LanguagePair } from "@/lib/types";
import { translateText } from "@/app/actions/translate";
import { getLanguageByCode } from "@/lib/languages";

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useTranslationSession(languages: LanguagePair) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<string>("");
  const currentLogIdRef = useRef<string | null>(null);

  // Start recording session
  const startRecording = useCallback(async () => {
    try {
      setStatus("connecting");

      // Check if browser supports Speech Recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
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
      recognition.onresult = async (event: any) => {
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
        }

        // Handle final results
        if (finalTranscript) {
          const finalText = finalTranscript.trim();

          if (finalText) {
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

              // Reset current transcript for next input
              currentTranscriptRef.current = "";
              currentLogIdRef.current = null;

              // Translate the final text (async operation)
              setStatus("translating");
              const targetLang = getLanguageByCode(languages.target);

              translateText(
                finalText,
                sourceLang.translationName,
                targetLang?.translationName || languages.target
              ).then(({ translatedText }) => {
                // Update log with translation
                setLogs((prev) =>
                  prev.map((log) =>
                    log.id === logIdToUpdate
                      ? { ...log, translated: translatedText, isFinal: true }
                      : log
                  )
                );
                setStatus("listening");
              }).catch((error) => {
                console.error("Translation error:", error);
                setLogs((prev) =>
                  prev.map((log) =>
                    log.id === logIdToUpdate
                      ? { ...log, translated: "[Translation Error]", isFinal: true }
                      : log
                  )
                );
                setStatus("listening");
              });
            }
          }
        }
      };

      recognition.onstart = () => {
        setStatus("listening");
        setIsRecording(true);
        isRecordingRef.current = true;
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "no-speech") {
          // No speech detected, just continue
          return;
        }

        if (event.error === "not-allowed") {
          setStatus("error");
          setIsRecording(false);
          isRecordingRef.current = false;
          alert("Microphone access was denied. Please allow microphone access in your browser settings.");
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
  }, [languages]);

  // Stop recording session
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
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
