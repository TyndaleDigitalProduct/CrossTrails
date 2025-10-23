const { performance } = require('perf_hooks');
const { parseHTML } = require('linkedom');

async function fetchHtml(url) {
  const res = await fetch(url);
  return await res.text();
}

function htmlToText(html) {
  return html
    .replace(/<\/??em>/g, '')
    .replace(/<a[^>]*>\s*<\/a>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRegex(html, referenceHint) {
  const verses = [];
  const verseRegex = /<verse_export\s+([^>]*)>([\s\S]*?)<\/verse_export>/gi;
  let m;
  while ((m = verseRegex.exec(html))) {
    const attrs = m[1];
    const body = m[2];
    const bkMatch = /bk="([^"]+)"/i.exec(attrs);
    const chMatch = /ch="([^"]+)"/i.exec(attrs);
    const vnMatch = /vn="([^"]+)"/i.exec(attrs);
    const bk = bkMatch
      ? bkMatch[1][0].toUpperCase() + bkMatch[1].slice(1)
      : undefined;
    const ch = chMatch ? parseInt(chMatch[1], 10) : undefined;
    const vn = vnMatch ? parseInt(vnMatch[1], 10) : undefined;

    let working = body
      .replace(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/gi, '')
      .replace(/<a[^>]*class="[^\"]*\ba-tn\b[^\"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

    // remove vn, tn-ref, and tn elements iteratively
    const removeByClass = (input, token) => {
      const rx = new RegExp(
        `<([a-z][^>]*?)[^>]*class=\"[^\\\"]*\\b${token}\\b[^\\\"]*\"[^>]*>[\\s\\S]*?<\\/\\1>`,
        'gi'
      );
      let prev;
      do {
        prev = input;
        input = input.replace(rx, '');
      } while (input !== prev);
      return input;
    };

    working = removeByClass(working, 'vn');
    working = removeByClass(working, 'tn-ref');
    working = removeByClass(working, 'tn');
    working = working.replace(/<([a-z][^>]*)>\s*<\/\1>/gi, '');

    const parts = [];
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
    if (parts.length === 0 && working && working.trim()) parts.push(working);

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
      const partsRef = (referenceHint || '').split('.');
      if (partsRef.length >= 3) {
        const inferredBk = partsRef[0][0].toUpperCase() + partsRef[0].slice(1);
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

function parseDOM(html, referenceHint) {
  const doc = parseHTML(html).window.document;
  const nodes = Array.from(doc.querySelectorAll('verse_export'));
  const verses = [];
  for (const veNode of nodes) {
    const ve = veNode;
    const bkAttr = ve.getAttribute('bk');
    const chAttr = ve.getAttribute('ch');
    const vnAttr = ve.getAttribute('vn');
    const bk = bkAttr ? bkAttr[0].toUpperCase() + bkAttr.slice(1) : undefined;
    const ch = chAttr ? parseInt(chAttr, 10) : undefined;
    const vn = vnAttr ? parseInt(vnAttr, 10) : undefined;

    Array.from(ve.querySelectorAll('h2,h3')).forEach(n => n.remove());
    Array.from(ve.querySelectorAll('span.vn, a.a-tn')).forEach(n => n.remove());
    Array.from(ve.querySelectorAll('[class*="tn-ref"], [class*="tn"]')).forEach(
      n => n.remove()
    );

    const parts = [];
    for (const child of Array.from(ve.childNodes)) {
      if (child.nodeType === 3) {
        const txt = child.textContent || '';
        if (txt.trim()) parts.push(txt);
      } else if (child.nodeType === 1) {
        const el = child;
        if (el.tagName && el.tagName.toLowerCase() === 'p') {
          const txt = el.textContent || '';
          if (txt.trim()) parts.push(txt);
        } else {
          if (!el.querySelector || !el.querySelector('p')) {
            const txt = el.textContent || '';
            if (txt.trim()) parts.push(txt);
          }
        }
      }
    }

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
        const inferredBk = partsRef[0][0].toUpperCase() + partsRef[0].slice(1);
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

async function run() {
  const url =
    'https://api.nlt.to/api/passages?ref=exod.3.15&version=NLT&key=TEST';
  console.log('Fetching HTML...');
  const html = await fetchHtml(url);
  console.log('Warmup...');
  // Warmup
  parseRegex(html, 'exod.3.15');
  parseDOM(html, 'exod.3.15');

  const ITERS = 200;

  let t0 = performance.now();
  for (let i = 0; i < ITERS; i++) parseRegex(html, 'exod.3.15');
  let t1 = performance.now();
  const regexMs = t1 - t0;

  t0 = performance.now();
  for (let i = 0; i < ITERS; i++) parseDOM(html, 'exod.3.15');
  t1 = performance.now();
  const domMs = t1 - t0;

  console.log(
    'Regex total ms:',
    regexMs.toFixed(2),
    'avg ms:',
    (regexMs / ITERS).toFixed(4)
  );
  console.log(
    'DOM total ms:  ',
    domMs.toFixed(2),
    'avg ms:',
    (domMs / ITERS).toFixed(4)
  );
  console.log('Ratio DOM/Regex:', (domMs / regexMs).toFixed(2));
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
