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
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          From
        </label>
        <Select
          value={sourceLang}
          onValueChange={onSourceChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-10">
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

      <div className="hidden md:block pb-1">
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          To
        </label>
        <Select
          value={targetLang}
          onValueChange={onTargetChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-10">
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
