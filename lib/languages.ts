export type Language = {
  code: string;
  name: string;
  speechRecognitionCode: string; // Web Speech API用の言語コード
  translationName: string; // 翻訳API用の言語名
};

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: "ja",
    name: "日本語",
    speechRecognitionCode: "ja-JP",
    translationName: "Japanese",
  },
  {
    code: "en",
    name: "English",
    speechRecognitionCode: "en-US",
    translationName: "English",
  },
  {
    code: "zh",
    name: "中文",
    speechRecognitionCode: "zh-CN",
    translationName: "Chinese",
  },
  {
    code: "ko",
    name: "한국어",
    speechRecognitionCode: "ko-KR",
    translationName: "Korean",
  },
  {
    code: "es",
    name: "Español",
    speechRecognitionCode: "es-ES",
    translationName: "Spanish",
  },
  {
    code: "fr",
    name: "Français",
    speechRecognitionCode: "fr-FR",
    translationName: "French",
  },
  {
    code: "de",
    name: "Deutsch",
    speechRecognitionCode: "de-DE",
    translationName: "German",
  },
  {
    code: "it",
    name: "Italiano",
    speechRecognitionCode: "it-IT",
    translationName: "Italian",
  },
  {
    code: "pt",
    name: "Português",
    speechRecognitionCode: "pt-BR",
    translationName: "Portuguese",
  },
  {
    code: "ru",
    name: "Русский",
    speechRecognitionCode: "ru-RU",
    translationName: "Russian",
  },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
};

export const getLanguageName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language ? language.name : code;
};
