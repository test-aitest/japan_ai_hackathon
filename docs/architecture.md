# Architecture Design (architecture.md)

## 1. システム構成図 (High-Level Architecture)

**構成:** Client (Next.js) <--> Server Actions <--> AssemblyAI / OpenRouter

読み上げ機能は持たないため、出力は画面表示のみとなる。

### データフロー (翻訳時)

1. **Setup:** ユーザーが「日本語 -> 英語」などを選択。
2. **User Voice** -> Browser (RecordRTC)
3. **Audio Stream** -> AssemblyAI WebSocket (Source 言語設定) -> **Transcription Text (原文)**
4. **Transcription Text** -> Client State Update (原文を即時表示)
5. **Final Transcript** -> Server Action (`translateText`) -> OpenRouter (LLM) -> **Translated Text (訳文)**
6. **Translated Text** -> Client State Update (訳文を表示エリアに追記)

## 2. ディレクトリ構造

- **`app/actions/`**: サーバーサイドロジック。
- **`app/hooks/`**:
  - `useTranslationSession.ts`: 音声認識と翻訳 API 呼び出しを管理するカスタムフック。
- **`components/translator/`**:
  - `LanguageSelector`: 言語ペア選択 UI。
  - `TranslationLog`: 原文と訳文のリスト表示コンポーネント。
  - `RecordingButton`: マイク制御ボタン。

## 3. データ管理 (Client-Side State)

### State Definitions

- **`translationLog`**:
  ```typescript
  type LogItem = {
    id: string;
    original: string; // 原文
    translated: string; // 訳文（翻訳中はnullまたは空文字）
    isFinal: boolean; // 翻訳完了フラグ
  };
  ```
