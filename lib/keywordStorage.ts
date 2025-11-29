import { Keyword } from "./types";

const STORAGE_KEY = "hanasu_keywords";

export function getKeywords(): Keyword[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load keywords:", error);
    return [];
  }
}

export function saveKeywords(keywords: Keyword[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
  } catch (error) {
    console.error("Failed to save keywords:", error);
  }
}

export function addKeyword(keyword: Omit<Keyword, "id">): Keyword {
  const keywords = getKeywords();
  const newKeyword: Keyword = {
    ...keyword,
    id: `keyword-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  keywords.push(newKeyword);
  saveKeywords(keywords);
  return newKeyword;
}

export function updateKeyword(
  id: string,
  updates: Partial<Omit<Keyword, "id">>
): void {
  const keywords = getKeywords();
  const index = keywords.findIndex((k) => k.id === id);
  if (index !== -1) {
    keywords[index] = { ...keywords[index], ...updates };
    saveKeywords(keywords);
  }
}

export function deleteKeyword(id: string): void {
  const keywords = getKeywords();
  const filtered = keywords.filter((k) => k.id !== id);
  saveKeywords(filtered);
}

export function getKeywordsForLanguagePair(
  sourceLang: string,
  targetLang: string
): Keyword[] {
  const keywords = getKeywords();
  return keywords.filter(
    (k) =>
      (k.sourceLang === sourceLang && k.targetLang === targetLang) ||
      (k.sourceLang === "*" && k.targetLang === "*")
  );
}

export function getAllKeywords(): Keyword[] {
  return getKeywords();
}

export function applyKeywords(text: string): string {
  const allKeywords = getKeywords();
  let result = text;

  const sortedKeywords = allKeywords.sort(
    (a, b) => b.term.length - a.term.length
  );

  for (const keyword of sortedKeywords) {
    const regex = new RegExp(`\\b${escapeRegex(keyword.term)}\\b`, "gi");
    result = result.replace(regex, keyword.translation);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
