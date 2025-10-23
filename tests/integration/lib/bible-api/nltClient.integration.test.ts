import nltClient from '../../../../lib/bible-api/nltClient';

describe('nltClient DOM parsing (integration-style)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses exod.3.15 HTML and removes headings/tn notes', async () => {
    const sample = `
      <verse_export orig="exod_3_15" bk="exod" ch="3" vn="15">
        <h2 class="chapter-number"><span class="cw">Exodus</span>&nbsp;<span class="cw_ch">3</span></h2>
        <h3 class="subhead">Moses and the Burning Bush</h3>
        <p class="body-ch-hd"><span class="vn">15</span>God also said to Moses, "Say this to the people of Israel: Yahweh, the God of your ancestors..."<a class="a-tn">*</a><span class="tn"><span class="tn-ref">3:15</span> <em>Yahweh</em> note text that should be removed.</span></p>
      </verse_export>
    `;

    // @ts-ignore
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, text: async () => sample });

    const res = await nltClient.getVersesByReference('exod.3.15');
    expect(res.verses.length).toBeGreaterThan(0);
    const v = res.verses[0];
    expect(v.verse_number).toBe(15);
    expect(v.text).toContain('God also said to Moses');
    // text-note should not appear
    expect(v.text).not.toContain('note text that should be removed');
  });
});
