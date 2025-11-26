import { Keyword } from "./types";

const STORAGE_KEY = "hanasu_keywords";

/**
 * Get all keywords from localStorage
 */
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

/**
 * Save keywords to localStorage
 */
export function saveKeywords(keywords: Keyword[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
  } catch (error) {
    console.error("Failed to save keywords:", error);
  }
}

/**
 * Add a new keyword
 */
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

/**
 * Update an existing keyword
 */
export function updateKeyword(id: string, updates: Partial<Omit<Keyword, "id">>): void {
  const keywords = getKeywords();
  const index = keywords.findIndex((k) => k.id === id);
  if (index !== -1) {
    keywords[index] = { ...keywords[index], ...updates };
    saveKeywords(keywords);
  }
}

/**
 * Delete a keyword
 */
export function deleteKeyword(id: string): void {
  const keywords = getKeywords();
  const filtered = keywords.filter((k) => k.id !== id);
  saveKeywords(filtered);
}

/**
 * Get keywords for a specific language pair
 */
export function getKeywordsForLanguagePair(
  sourceLang: string,
  targetLang: string
): Keyword[] {
  const keywords = getKeywords();
  return keywords.filter(
    (k) =>
      // Match exact language pair OR universal keywords (marked with "*")
      (k.sourceLang === sourceLang && k.targetLang === targetLang) ||
      (k.sourceLang === "*" && k.targetLang === "*")
  );
}

/**
 * Get all keywords regardless of language
 */
export function getAllKeywords(): Keyword[] {
  return getKeywords();
}

/**
 * Apply keywords to text (replace terms with translations)
 * Applies ALL keywords regardless of language
 */
export function applyKeywords(text: string): string {
  // Get all keywords (including universal ones)
  const allKeywords = getKeywords();
  let result = text;

  // Sort by term length (longest first) to handle overlapping terms
  const sortedKeywords = allKeywords.sort((a, b) => b.term.length - a.term.length);

  for (const keyword of sortedKeywords) {
    // Create a case-insensitive regex with word boundaries
    const regex = new RegExp(`\\b${escapeRegex(keyword.term)}\\b`, "gi");
    result = result.replace(regex, keyword.translation);
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
