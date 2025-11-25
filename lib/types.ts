/**
 * Translation log item
 */
export type LogItem = {
  id: string;
  original: string; // 原文
  translated: string; // 訳文（翻訳中はnullまたは空文字）
  isFinal: boolean; // 翻訳完了フラグ
  timestamp: number; // タイムスタンプ
};

/**
 * Translation session status
 */
export type SessionStatus = "idle" | "connecting" | "listening" | "translating" | "error";

/**
 * Language pair for translation
 */
export type LanguagePair = {
  source: string;
  target: string;
};
