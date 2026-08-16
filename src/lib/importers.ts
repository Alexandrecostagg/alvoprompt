export const IMPORTABLE_EXT = '.txt,.md,.markdown,.text,.docx,.pdf'

let workerConfigured = false

export function fileNameFromImport(name: string): string {
  return name.replace(/\.(txt|md|markdown|text|docx|pdf)$/i, '')
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return extractPdf(file)
  }
  if (
    ext === 'docx' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractDocx(file)
  }
  return file.text()
}

async function extractDocx(file: File): Promise<string> {
  const { default: mammoth } = await import('mammoth')
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return (result.value || '').trim()
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const { default: pdfWorkerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    workerConfigured = true
  }
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise
  try {
    const parts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text) parts.push(text)
    }
    if (!parts.length) {
      throw new Error('Não foi possível extrair texto deste PDF (pode ser escaneado/imagem).')
    }
    return parts.join('\n\n')
  } finally {
    await loadingTask.destroy()
  }
}

export async function extractTextFromUrl(rawUrl: string): Promise<string> {
  let u: URL
  try {
    u = new URL(rawUrl)
  } catch {
    throw new Error('Link inválido. Informe uma URL completa (ex.: https://exemplo.com/texto).')
  }
  if (/(youtube\.com|youtu\.be)/i.test(u.hostname)) {
    throw new Error(
      'Importar transcrição do YouTube exige um servidor de API (roadmap Fase 3). Cole o texto do roteiro direto no editor.',
    )
  }
  if (/docs\.google\.com/i.test(u.hostname)) {
    throw new Error(
      'Google Docs requer permissões. No documento use Arquivo > Baixar > Texto (.txt) e importe o arquivo aqui.',
    )
  }
  const res = await fetch(u, { mode: 'cors' })
  if (!res.ok) throw new Error(`Falha ao buscar o link (HTTP ${res.status}).`)
  const text = (await res.text()).trim()
  if (!text) throw new Error('O link retornou conteúdo vazio.')
  return text
}
