/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'mammoth' {
  interface ExtractResult {
    value: string
    messages: unknown[]
  }
  export function extractRawText(options: {
    arrayBuffer: ArrayBuffer
  }): Promise<ExtractResult>
}
