import { BibleVerse } from '@/lib/types';
import { parseNltSearchHtml } from '../parsers/search';

const BASE_URL = (process.env.NLT_API_BASE_URL || 'https://api.nlt.to').replace(
  /\/$/,
  ''
);
const API_KEY = process.env.NLT_API_KEY || process.env.NLT_API_TOKEN || '';
const TIMEOUT_MS = 5000;

const nltBkToAbbrev: Record<string, string> = {
  gene: 'Gen',
  exod: 'Exod',
  levi: 'Lev',
  numb: 'Num',
  deut: 'Deut',
  josh: 'Josh',
  judg: 'Judg',
  ruth: 'Ruth',
  sam1: '1Sam',
  sam2: '2Sam',
  kgs1: '1Kgs',
  kgs2: '2Kgs',
  chr1: '1Chr',
  chr2: '2Chr',
  ezra: 'Ezra',
  nehe: 'Neh',
  esth: 'Esth',
  job: 'Job',
  psal: 'Ps',
  prov: 'Pr',
  eccl: 'Eccl',
  song: 'Song',
  isai: 'Isa',
  jere: 'Jer',
  lame: 'Lam',
  ezek: 'Ezek',
  dani: 'Dan',
  hose: 'Hos',
  joel: 'Joel',
  amos: 'Amos',
  obad: 'Obad',
  jona: 'Jon',
  mica: 'Mic',
  nahu: 'Nah',
  haba: 'Hab',
  zeph: 'Zeph',
  hagg: 'Hagg',
  zech: 'Zech',
  mala: 'Mal',
  matt: 'Matt',
  mark: 'Mark',
  luke: 'Luke',
  john: 'John',
  acts: 'Acts',
  roma: 'Rom',
  cor1: '1Cor',
  cor2: '2Cor',
  gala: 'Gal',
  ephe: 'Eph',
  phil: 'Phil',
  colo: 'Col',
  the1: '1Thes',
  the2: '2Thes',
  tim1: '1Tim',
  tim2: '2Tim',
  titu: 'Titus',
  phlm: 'Phlm',
  hebr: 'Heb',
  jame: 'Jas',
  pet1: '1Pet',
  pet2: '2Pet',
  joh1: '1Jn',
  joh2: '2Jn',
  joh3: '3Jn',
  jude: 'Jude',
  reve: 'Rev',
};

function makeUrl(
  path: string,
  params: Record<string, string | number | undefined> = {}
) {
  const url = new URL(`${BASE_URL}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  // Always include the NLT version parameter for this project
  url.searchParams.set('version', 'NLT');
  if (API_KEY) url.searchParams.set('key', API_KEY);
  return url.toString();
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`NLT API error ${res.status}: ${body}`);
    }
    return await res.text();
  } finally {
    clearTimeout(id);
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
    .trim();
}

function capitalize(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function parseHTMLtoJSON(html: string, referenceHint?: string) {
  const verses: BibleVerse[] = [];

  // Find all <verse_export ...>...</verse_export>
  const verseRegex = /<verse_export\s+([^>]*)>([\s\S]*?)<\/verse_export>/gi;
  let m: RegExpExecArray | null;
  while ((m = verseRegex.exec(html))) {
    const attrs = m[1];
    const body = m[2];

    const bkMatch = /bk="([^"]+)"/i.exec(attrs);
    const chMatch = /ch="([^"]+)"/i.exec(attrs);
    const vnMatch = /vn="([^"]+)"/i.exec(attrs);

    const bk = bkMatch ? capitalize(bkMatch[1]) : undefined;
    const ch = chMatch ? parseInt(chMatch[1], 10) : undefined;
    const vn = vnMatch ? parseInt(vnMatch[1], 10) : undefined;

    // Remove structural headings (h2/h3) and known noise. We iteratively remove
    // elements by their class token (vn, tn-ref, tn) using a helper so nested
    // structures are removed reliably.
    let working = body
      // remove h2 and h3 blocks entirely
      .replace(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/gi, '')
      // remove anchor footnote markers like <a class="a-tn">*</a>
      .replace(/<a[^>]*class="[^\"]*\ba-tn\b[^\"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

    // helper: remove elements whose class attribute contains the given token
    const removeByClass = (input: string, token: string) => {
      const rx = new RegExp(
        `<([a-z][^>]*?)[^>]*class="[^\\"]*\\b${token}\\b[^\\"]*"[^>]*>[\\s\\S]*?<\\/\\1>`,
        'gi'
      );
      let prev: string;
      do {
        prev = input;
        input = input.replace(rx, '');
      } while (input !== prev);
      return input;
    };

    // Remove numeric verse markers and tn-ref markers (they are identifiers we don't want)
    working = removeByClass(working, 'vn');
    working = removeByClass(working, 'tn-ref');
    // For tn (text-notes) we want to remove the entire explanatory note
    working = removeByClass(working, 'tn');
    // After removals, clean up any empty tags left behind
    working = working.replace(/<([a-z][^>]*)>\s*<\/\1>/gi, '');

    // Collect text parts in order: any text outside <p> plus all <p> blocks
    // Do NOT assume a particular class on the <p> elements; accept any <p>.
    const parts: string[] = [];
    let remaining = working;
    const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/i;
    while (true) {
      const pMatch = pRegex.exec(remaining);
      if (!pMatch) {
        if (remaining && remaining.trim()) parts.push(remaining);
        break;
      }
      const idx = pMatch.index;
      const pre = remaining.slice(0, idx);
      if (pre && pre.trim()) parts.push(pre);
      parts.push(pMatch[1]);
      remaining = remaining.slice(idx + pMatch[0].length);
    }

    // Fallback: if no <p class="body"> and parts is empty, use the whole body
    if (parts.length === 0 && working && working.trim()) parts.push(working);

    // Clean each part and join with a single space. Also remove leftover footnote markers like '*'
    const cleaned = parts
      .map(part => htmlToText(part))
      .map(t => t.replace(/\*+/g, ' '))
      .filter(Boolean)
      .join(' ');

    if (vn !== undefined && ch !== undefined && bk) {
      verses.push({
        verse_number: vn,
        verse_id: `${bk}.${ch}.${vn}`,
        text: cleaned,
      });
    } else if (referenceHint) {
      // Try to infer from reference hint like John.3.3
      const partsRef = (referenceHint || '').split('.');
      if (partsRef.length >= 3) {
        const inferredBk = capitalize(partsRef[0]);
        const inferredCh = parseInt(partsRef[1], 10);
        const inferredVn = parseInt(partsRef[2], 10);
        verses.push({
          verse_number: inferredVn || 0,
          verse_id: `${inferredBk}.${inferredCh}.${inferredVn}`,
          text: cleaned,
        });
      }
    }
  }

  return verses;
}

/**
 * DOM-based parser: more robust than regex. Attempts to use global DOMParser,
 * otherwise falls back to `linkedom` if available. Removes <h2>/<h3>, vn markers,
 * footnote anchors, and text-notes (tn / tn-ref). Returns the same shape as
 * parseHTMLtoJSON: BibleVerse[]
 */
function parseHTMLwithDOM(html: string, referenceHint?: string) {
  // Acquire a document parser
  let doc: any = null;
  if (typeof (globalThis as any).DOMParser === 'function') {
    const DP = (globalThis as any).DOMParser;
    doc = new DP().parseFromString(html, 'text/html');
  } else {
    try {
      const { parseHTML } = require('linkedom');
      doc = parseHTML(html).window.document;
    } catch (e) {
      throw new Error(
        'No DOM parser available. Install `linkedom` or run in environment with DOMParser.'
      );
    }
  }

  const verses: BibleVerse[] = [];
  const nodes = Array.from(doc.querySelectorAll('verse_export'));

  for (const veNode of nodes) {
    const ve = veNode as Element;
    const bkAttr = ve.getAttribute('bk');
    const chAttr = ve.getAttribute('ch');
    const vnAttr = ve.getAttribute('vn');

    const bkRaw = bkAttr ? bkAttr.toLowerCase() : undefined;
    const bk = bkRaw ? nltBkToAbbrev[bkRaw] || bkRaw : undefined;
    const ch = chAttr ? parseInt(chAttr, 10) : undefined;
    const vn = vnAttr ? parseInt(vnAttr, 10) : undefined;

    // Remove headings
    Array.from(ve.querySelectorAll('h2,h3')).forEach((n: any) => n.remove());

    // Remove verse-number spans and anchor footnote markers
    Array.from(ve.querySelectorAll('span.vn, a.a-tn')).forEach((n: any) =>
      n.remove()
    );

    // Remove any tn or tn-ref elements (text-notes) completely
    Array.from(ve.querySelectorAll('[class*="tn"]')).forEach((n: any) =>
      n.remove()
    );

    // Collect text parts in document order: text nodes and <p> blocks
    const parts: string[] = [];
    for (const child of Array.from(ve.childNodes)) {
      // nodeType 3 = text node, 1 = element
      if ((child as any).nodeType === 3) {
        const txt = (child as Node).textContent || '';
        if (txt.trim()) parts.push(txt);
      } else if ((child as any).nodeType === 1) {
        const el = child as Element;
        if (el.tagName && el.tagName.toLowerCase() === 'p') {
          const txt = el.textContent || '';
          if (txt.trim()) parts.push(txt);
        } else {
          // Other elements: if they contain <p>, those will be handled when iterating; otherwise include their text
          if (!el.querySelector || !el.querySelector('p')) {
            const txt = el.textContent || '';
            if (txt.trim()) parts.push(txt);
          }
        }
      }
    }

    // Fallback
    if (parts.length === 0) {
      const whole = ve.textContent || '';
      if (whole.trim()) parts.push(whole);
    }

    const cleaned = parts
      .map(p => htmlToText(p))
      .map(t => t.replace(/\*+/g, ' '))
      .filter(Boolean)
      .join(' ');

    if (vn !== undefined && ch !== undefined && bk) {
      verses.push({
        verse_number: vn,
        verse_id: `${bk}.${ch}.${vn}`,
        text: cleaned,
      });
    } else if (referenceHint) {
      const partsRef = (referenceHint || '').split('.');
      if (partsRef.length >= 3) {
        const inferredBk = capitalize(partsRef[0]);
        const inferredCh = parseInt(partsRef[1], 10);
        const inferredVn = parseInt(partsRef[2], 10);
        verses.push({
          verse_number: inferredVn || 0,
          verse_id: `${inferredBk}.${inferredCh}.${inferredVn}`,
          text: cleaned,
        });
      }
    }
  }

  return verses;
}

export async function getVersesByChapter(book: string, chapter: number) {
  const ref = `${book}.${chapter}`;
  const url = makeUrl('api/passages', { ref, version: 'NLT' });
  const text = await fetchText(url);
  let verses;
  try {
    verses = parseHTMLwithDOM(text, ref);
  } catch (e) {
    // fallback to regex-based parser
    verses = parseHTMLtoJSON(text, ref);
  }
  return { book: capitalize(book), chapter, verses };
}

export async function getVersesByReference(reference: string) {
  const url = makeUrl('api/passages', { ref: reference, version: 'NLT' });
  const text = await fetchText(url);
  let verses;
  try {
    verses = parseHTMLwithDOM(text, reference);
  } catch (e) {
    verses = parseHTMLtoJSON(text, reference);
  }
  // Attempt to infer book/chapter
  const parts = reference.split('.');
  const book = capitalize(parts[0] || 'Unknown');
  const chapter = parts[1] ? parseInt(parts[1], 10) : 1;
  return { book, chapter, verses };
}

export async function getPassagesBySearch(terms: string) {
  const termsValue = terms.replace(' ', '+');
  const url = makeUrl('api/search', { text: termsValue, version: 'NLT' });
  const result = await fetchText(url);

  const parsedResult = parseNltSearchHtml(result);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(parsedResult, null, 2),
      },
    ],
    structuredOutput: parsedResult,
  };
}

export default {
  getVersesByChapter,
  getVersesByReference,
  getPassagesBySearch,
};
