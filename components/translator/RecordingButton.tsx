"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { SessionStatus } from "@/lib/types";
import { motion } from "framer-motion";

type RecordingButtonProps = {
  isRecording: boolean;
  status: SessionStatus;
  onToggle: () => void;
  disabled?: boolean;
};

export function RecordingButton({
  isRecording,
  status,
  onToggle,
  disabled = false,
}: RecordingButtonProps) {
  const getButtonText = () => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "listening":
        return "Recording";
      case "translating":
        return "Translating...";
      case "error":
        return "Error";
      default:
        return "Start Recording";
    }
  };

  const getIcon = () => {
    if (status === "connecting" || status === "translating") {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    return isRecording ? (
      <MicOff className="w-5 h-5" />
    ) : (
      <Mic className="w-5 h-5" />
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        whileTap={{ scale: 0.97 }}
      >
        <Button
          onClick={onToggle}
          disabled={disabled || status === "connecting"}
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="min-w-[180px] h-12 font-medium"
        >
          <span className="mr-2">{getIcon()}</span>
          {getButtonText()}
        </Button>
      </motion.div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isRecording ? "bg-red-500 animate-pulse" : "bg-muted-foreground/40"
          }`}
        />
        <span className="text-xs text-muted-foreground">
          {status === "idle" && "Ready"}
          {status === "connecting" && "Starting..."}
          {status === "listening" && "Listening"}
          {status === "translating" && "Translating"}
          {status === "error" && "Error occurred"}
        </span>
      </div>
    </div>
  );
}
