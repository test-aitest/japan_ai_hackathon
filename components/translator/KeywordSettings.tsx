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
import { ConferenceImport } from "./ConferenceImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleImportFromConference = (
    importedKeywords: Omit<Keyword, "id">[]
  ) => {
    const newKeywords = importedKeywords.map((kw) => addKeyword(kw));
    setKeywords([...keywords, ...newKeywords]);
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
          <DialogTitle>Custom Keywords</DialogTitle>
          <DialogDescription>
            Automatically replace recognized terms with different words. Useful
            for technical jargon and abbreviations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Tabs defaultValue="conference" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conference">
                Import from Conference
              </TabsTrigger>
              <TabsTrigger value="manual">Add Manually</TabsTrigger>
            </TabsList>

            <TabsContent value="conference" className="mt-4">
              <ConferenceImport onImport={handleImportFromConference} />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Add Manually</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Original Term
                      </label>
                      <Input
                        placeholder="e.g., AI"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Replace With
                      </label>
                      <Input
                        placeholder="e.g., Artificial Intelligence"
                        value={newTranslation}
                        onChange={(e) => setNewTranslation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Target Language
                    </label>
                    <Select
                      value={newSourceLang}
                      onValueChange={(value) => {
                        setNewSourceLang(value);
                        setNewTargetLang(value);
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
                      Replace terms when recognized in this language
                    </p>
                  </div>

                  <Button
                    onClick={handleAddKeyword}
                    disabled={!newTerm.trim() || !newTranslation.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Registered Keywords</h3>
            {keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No keywords registered yet
              </p>
            ) : (
              <div className="space-y-2">
                {keywords.map((keyword) => {
                  const lang = SUPPORTED_LANGUAGES.find(
                    (l) => l.code === keyword.sourceLang
                  );
                  const displayLang =
                    keyword.sourceLang === "*" ? "All Languages" : lang?.name;

                  return (
                    <Card key={keyword.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {keyword.sourceLang === "*" ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {keyword.term}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {keyword.term}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">
                                  {keyword.translation}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {displayLang}
                              </div>
                            </>
                          )}
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
