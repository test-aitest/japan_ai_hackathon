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
  const getIcon = () => {
    if (status === "connecting" || status === "translating") {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    return isRecording ? (
      <Mic className="w-5 h-5" />
    ) : (
      <Mic className="w-5 h-5" />
    );
  };

  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onToggle}
        disabled={disabled || status === "connecting"}
        size="icon"
        className={`w-12 h-12 rounded-full ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {getIcon()}
      </Button>
    </motion.div>
  );
}
