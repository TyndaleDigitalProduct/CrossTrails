(async () => {
  try {
    const { parseHTML } = require('linkedom')
    const fetch = globalThis.fetch || (await import('node-fetch')).default
    const url = 'https://api.nlt.to/api/passages?ref=exod.3.15&version=NLT&key=TEST'
    const res = await fetch(url)
    const html = await res.text()

    const doc = parseHTML(html).window.document
    const nodes = Array.from(doc.querySelectorAll('verse_export'))
    const out = []

    for (const node of nodes) {
      const bk = node.getAttribute('bk')
      const ch = node.getAttribute('ch')
      const vn = node.getAttribute('vn')

      // remove headings
      Array.from(node.querySelectorAll('h2,h3')).forEach(n => n.remove())
      // remove vn spans and a.a-tn
      Array.from(node.querySelectorAll('span.vn, a.a-tn')).forEach(n => n.remove())
      // remove tn and tn-ref entirely
      Array.from(node.querySelectorAll('[class*="tn-ref"], [class*="tn"]')).forEach(n => n.remove())

      const parts = []
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          const txt = child.textContent || ''
          if (txt.trim()) parts.push(txt)
        } else if (child.nodeType === 1) {
          const el = child
          if (el.tagName && el.tagName.toLowerCase() === 'p') {
            const txt = el.textContent || ''
            if (txt.trim()) parts.push(txt)
          } else {
            if (!el.querySelector || !el.querySelector('p')) {
              const txt = el.textContent || ''
              if (txt.trim()) parts.push(txt)
            }
          }
        }
      }

      const cleaned = parts
        .map(p => p.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(' ')

      out.push({ bk, ch, vn, text: cleaned })
    }

    console.log(JSON.stringify(out, null, 2))
  } catch (e) {
    console.error('ERR', e)
    process.exit(1)
  }
})()
