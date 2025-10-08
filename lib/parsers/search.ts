// src/searchParser.ts
//
// Parses HTML returned from https://api.nlt.to/api/search?text=...&key=...
// The HTML includes:
//   <h1>search terms</h1>
//   <h2 class="results"><span class="count">### result(s)</span> … (version=NLT)</h2>
//   <table><tr><td><a href="...">Ref</a></td><td>Passage text</td></tr>...</table>
//
// No external packages required.

export interface SearchResult {
  reference: string;    // e.g. "Gen.2.24"
  url: string;          // e.g. "https://nlt.to/Gen.2.24/"
  passage: string;      // verse text with HTML stripped, highlights removed
}

export interface SearchResponse {
  query: string;        // search terms, e.g. "mother and father"
  count: number;        // number of matches
  version?: string;     // e.g. "NLT"
  results: SearchResult[];
}

/**
* Parse NLT search results HTML into a structured object.
*/
export function parseNltSearchHtml(html: string): SearchResponse {
  const decode = (s: string) =>
    s.replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");
  
  // Search terms <h1>
  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const query = h1Match ? decode(h1Match[1].trim()) : "";
  
  // Count and version inside <h2 class="results">
  const h2Match = /<h2[^>]*class=["'][^"']*\bresults\b[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i.exec(html);
  let count = 0;
  let version: string | undefined;
  if (h2Match) {
    const text = decode(h2Match[1]);
    const c = /(\d+)\s+result/i.exec(text);
    if (c) count = parseInt(c[1], 10);
    const v = /\(version\s*=\s*([^)]+)\)/i.exec(text);
    if (v) version = v[1].trim();
  }
  
  // Table rows of references and passages
  const results: SearchResult[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html))) {
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let td: RegExpExecArray | null;
    while ((td = tdRe.exec(tr[1]))) {
      tds.push(td[1]);
    }
    if (tds.length < 2) continue;
    
    // First cell: <a href="...">Reference</a>
    const linkMatch = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(tds[0]);
    if (!linkMatch) continue;
    const url = linkMatch[1];
    const reference = decode(linkMatch[2].trim());
    
    // Second cell: passage text, strip all tags but keep text
    const passage = decode(
      tds[1]
      .replace(/<span\b[^>]*class=["'][^"']*\bhighlight\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    );
    
    results.push({ reference, url, passage });
  }
  
  return { query, count, version, results };
}
