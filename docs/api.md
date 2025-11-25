### 3. `api.md` (API 仕様書)

**変更点:**

- クライアントサイドの TTS 設定を削除。
- 翻訳アクションの仕様は維持。

```markdown
# API Specifications (api.md)

## 1. Next.js Server Actions

ファイル位置: `app/actions/translate.ts`
`'use server'` ディレクティブを使用。

### Operations

- `generateAssemblyAIToken`

  - **概要:** AssemblyAI 接続用トークン発行。
  - **Input:** なし
  - **Output:** `{ token: string }`

- `translateText`
  - **概要:** LLM を使用してテキストを翻訳する。
  - **Input:**
    - `text` (string): 翻訳したい原文
    - `sourceLang` (string): 原文の言語コード
    - `targetLang` (string): 目的の言語コード
  - **Process:**
    - OpenRouter API を呼び出す。
    - System Prompt: "Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text."
  - **Output:** `{ translatedText: string }`

## 2. External API Configurations

### AssemblyAI (Speech-to-Text)

- **Endpoint:** `wss://api.assemblyai.com/v2/realtime`
- **Params:** 接続時に `&language_code={sourceLang}` を指定する。

### OpenRouter (LLM)

- **Model:** `google/gemini-pro-1.5` (推奨)
- **Headers:** `Authorization`: Bearer $OPENROUTER_API_KEY
```
