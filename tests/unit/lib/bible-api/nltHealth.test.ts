import { checkNLTHealth } from '../../../../lib/bible-api/nltHealth'

describe('nltHealth.checkNLTHealth', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    delete process.env.NLT_API_KEY
    delete process.env.NLT_API_BASE_URL
    jest.restoreAllMocks()
  })

  it('returns not_configured when no key is present', async () => {
    delete process.env.NLT_API_KEY
    const res = await checkNLTHealth()
    expect(res).toBe('not_configured')
  })

  it('returns healthy when NLT responds with passage HTML', async () => {
    process.env.NLT_API_KEY = 'TEST'
    const fakeHtml = `<div id="bibletext"><section><h2 class="bk_ch_vs_header">John 1:1, NLT</h2><verse_export orig="john_1_1" bk="john" ch="1" vn="1"><p class="body"><span class="vn">1</span>In the beginning...</p></verse_export></section></div>`
    // Mock fetch to return a 200 OK with the fake HTML
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => fakeHtml })

    const res = await checkNLTHealth()
    expect(res).toBe('healthy')
    expect(global.fetch).toHaveBeenCalled()
  })

  it('returns unhealthy when NLT returns non-200', async () => {
    process.env.NLT_API_KEY = 'TEST'
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, text: async () => 'Not found' })

    const res = await checkNLTHealth()
    expect(res).toBe('unhealthy')
  })
})
