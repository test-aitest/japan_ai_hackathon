"use client";

import { LogItem } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

type TranslationLogProps = {
  logs: LogItem[];
};

export function TranslationLog({ logs }: TranslationLogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        <p>Translations will appear here</p>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto p-6">
      <AnimatePresence initial={false}>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-4 border-b last:border-b-0 border-border">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {!log.isFinal && (
                    <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1">
                    {log.translated ? (
                      <p className="text-base leading-relaxed text-foreground">
                        {log.translated}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Translating...
                      </p>
                    )}
                  </div>
                </div>

                <div className="pl-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {log.original}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
