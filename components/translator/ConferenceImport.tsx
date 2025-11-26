"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { extractKeywordsFromURL } from "@/app/actions/extractKeywords";
import { Keyword } from "@/lib/types";

type ConferenceImportProps = {
  onImport: (keywords: Omit<Keyword, "id">[]) => void;
};

export function ConferenceImport({ onImport }: ConferenceImportProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState<Omit<Keyword, "id">[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExtract = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setExtractedKeywords([]);

    try {
      const result = await extractKeywordsFromURL(url, "*", "*");

      if (result.error) {
        setError(result.error);
      } else if (result.keywords.length === 0) {
        setError("No proper nouns found");
      } else {
        setExtractedKeywords(result.keywords);
      }
    } catch (err) {
      setError("Extraction failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportAll = () => {
    onImport(extractedKeywords);
    setSuccess(true);
    setExtractedKeywords([]);
    setUrl("");

    // Reset success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Auto-Extract from Conference Site</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Enter a conference website URL to automatically extract proper nouns and technical terms. These keywords will be applied to all languages automatically.
      </p>

      <div className="space-y-3">
        {/* URL Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="https://conference.com/schedule"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleExtract}
            disabled={!url.trim() || loading}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract"
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Keywords added successfully
            </p>
          </div>
        )}

        {/* Extracted Keywords Preview */}
        {extractedKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Extracted Terms ({extractedKeywords.length})
              </p>
              <Button size="sm" onClick={handleImportAll}>
                Add All
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-muted/50 rounded-md">
              {extractedKeywords.map((kw, index) => (
                <div
                  key={index}
                  className="text-sm px-2 py-1 bg-background rounded border"
                >
                  {kw.term}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
