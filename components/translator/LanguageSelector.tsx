"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { ArrowRight } from "lucide-react";

type LanguageSelectorProps = {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  disabled?: boolean;
};

export function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          From
        </label>
        <Select
          value={sourceLang}
          onValueChange={onSourceChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ArrowRight className="w-4 h-4 text-muted-foreground" />

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          To
        </label>
        <Select
          value={targetLang}
          onValueChange={onTargetChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
