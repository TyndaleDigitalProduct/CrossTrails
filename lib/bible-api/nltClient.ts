import { BibleVerse } from '@/lib/types'

const BASE_URL = (process.env.NLT_API_BASE_URL || 'https://api.nlt.to').replace(/\/$/, '')
const API_KEY = process.env.NLT_API_KEY || process.env.NLT_API_TOKEN || ''
const TIMEOUT_MS = 5000

function makeUrl(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${BASE_URL}/${path.replace(/^\//, '')}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  })
  // Always include the NLT version parameter for this project
  url.searchParams.set('version', 'NLT')
  if (API_KEY) url.searchParams.set('key', API_KEY)
  return url.toString()
}

async function fetchText(url: string) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`NLT API error ${res.status}: ${body}`)
    }
    return await res.text()
  } finally {
    clearTimeout(id)
  }
}

function htmlToText(html: string) {
  // Minimal HTML -> text: remove tags but keep <em> as text, collapse whitespace
  return html
    .replace(/<\/?em>/g, '')
    .replace(/<a[^>]*>\s*<\/a>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function capitalize(word: string) {
  if (!word) return word
  return word[0].toUpperCase() + word.slice(1)
}

function parsePassageHtml(html: string, referenceHint?: string) {
  const verses: BibleVerse[] = []

  // Find all <verse_export ...>...</verse_export>
  const verseRegex = /<verse_export\s+([^>]*)>([\s\S]*?)<\/verse_export>/gi
  let m: RegExpExecArray | null
  while ((m = verseRegex.exec(html))) {
    const attrs = m[1]
    const body = m[2]

    const bkMatch = /bk="([^"]+)"/i.exec(attrs)
    const chMatch = /ch="([^"]+)"/i.exec(attrs)
    const vnMatch = /vn="([^"]+)"/i.exec(attrs)

    const bk = bkMatch ? capitalize(bkMatch[1]) : undefined
    const ch = chMatch ? parseInt(chMatch[1], 10) : undefined
    const vn = vnMatch ? parseInt(vnMatch[1], 10) : undefined

    // Extract <p class="body"> ... </p>
    const pMatch = /<p[^>]*class="body"[^>]*>([\s\S]*?)<\/p>/i.exec(body)
    const pHtml = pMatch ? pMatch[1] : body

    // Remove verse number span and footnote anchors/notes
    let cleaned = pHtml
      .replace(/<span[^>]*class="vn"[^>]*>[\s\S]*?<\/span>/i, '')
      .replace(/<a[^>]*class="a-tn"[^>]*>[\s\S]*?<\/a>/gi, '')
      .replace(/<span[^>]*class="tn"[^>]*>[\s\S]*?<\/span>/gi, '')

    cleaned = htmlToText(cleaned)

    if (vn !== undefined && ch !== undefined && bk) {
      verses.push({
        verse_number: vn,
        verse_id: `${bk}.${ch}.${vn}`,
        text: cleaned
      })
    } else if (referenceHint) {
      // Try to infer from reference hint like John.3.3
      const parts = (referenceHint || '').split('.')
      if (parts.length >= 3) {
        const inferredBk = capitalize(parts[0])
        const inferredCh = parseInt(parts[1], 10)
        const inferredVn = parseInt(parts[2], 10)
        verses.push({
          verse_number: inferredVn || 0,
          verse_id: `${inferredBk}.${inferredCh}.${inferredVn}`,
          text: cleaned
        })
      }
    }
  }

  return verses
}

export async function getVersesByChapter(book: string, chapter: number) {
  const ref = `${book}.${chapter}`
  const url = makeUrl('api/passages', { ref, version: 'NLT' })
  const text = await fetchText(url)
  const verses = parsePassageHtml(text, ref)
  return { book: capitalize(book), chapter, verses }
}

export async function getVersesByReference(reference: string) {
  const url = makeUrl('api/passages', { ref: reference, version: 'NLT' })
  const text = await fetchText(url)
  const verses = parsePassageHtml(text, reference)
  // Attempt to infer book/chapter
  const parts = reference.split('.')
  const book = capitalize(parts[0] || 'Unknown')
  const chapter = parts[1] ? parseInt(parts[1], 10) : 1
  return { book, chapter, verses }
}

export default {
  getVersesByChapter,
  getVersesByReference
}
