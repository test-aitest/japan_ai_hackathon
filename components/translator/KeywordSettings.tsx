"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Trash2, Plus } from "lucide-react";
import { Keyword } from "@/lib/types";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { getKeywords, addKeyword, deleteKeyword } from "@/lib/keywordStorage";

export function KeywordSettings() {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newSourceLang, setNewSourceLang] = useState("ja");
  const [newTargetLang, setNewTargetLang] = useState("ja");

  // Handle dialog open/close
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Load keywords when dialog opens
      setKeywords(getKeywords());
    }
  };

  const handleAddKeyword = () => {
    if (!newTerm.trim() || !newTranslation.trim()) return;

    const keyword = addKeyword({
      term: newTerm.trim(),
      translation: newTranslation.trim(),
      sourceLang: newSourceLang,
      targetLang: newTargetLang,
    });

    setKeywords([...keywords, keyword]);
    setNewTerm("");
    setNewTranslation("");
  };

  const handleDeleteKeyword = (id: string) => {
    deleteKeyword(id);
    setKeywords(keywords.filter((k) => k.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>カスタム用語集</DialogTitle>
          <DialogDescription>
            音声認識された用語を別の言葉に自動的に置き換えます。専門用語の言い換えや略語の展開に便利です。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Add new keyword */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">新しい用語を追加</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    元の用語
                  </label>
                  <Input
                    placeholder="例: AI"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">置き換え後</label>
                  <Input
                    placeholder="例: 人工知能"
                    value={newTranslation}
                    onChange={(e) => setNewTranslation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  対象言語
                </label>
                <Select
                  value={newSourceLang}
                  onValueChange={(value) => {
                    setNewSourceLang(value);
                    setNewTargetLang(value); // 同じ言語に設定
                  }}
                >
                  <SelectTrigger className="h-9">
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
                <p className="text-xs text-muted-foreground mt-1">
                  この言語で音声認識された時に用語を置き換えます
                </p>
              </div>

              <Button
                onClick={handleAddKeyword}
                disabled={!newTerm.trim() || !newTranslation.trim()}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>
          </Card>

          {/* Keyword list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">登録済み用語</h3>
            {keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                まだ用語が登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {keywords.map((keyword) => {
                  const lang = SUPPORTED_LANGUAGES.find(
                    (l) => l.code === keyword.sourceLang
                  );

                  return (
                    <Card key={keyword.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{keyword.term}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">
                              {keyword.translation}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lang?.name}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteKeyword(keyword.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
