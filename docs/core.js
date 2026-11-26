/* Rasd core: privacy + verification rules. Shared by the browser app and the Node server. */
(function (root) {
  const GRID = 0.005; // ~500 m cells: precise enough to be useful, too coarse to find a doorstep
  const VERIFY_AT = 3;
  const SEV = ['low', 'medium', 'high'];
  const CATS = ['road', 'safety', 'utilities', 'environment', 'misconduct', 'other'];

  function blur(lat, lng) {
    const snap = v => Math.round((Math.floor(v / GRID) * GRID + GRID / 2) * 1e6) / 1e6;
    return { lat: snap(lat), lng: snap(lng) };
  }
  function hourBucket(ts) { return Math.floor(ts / 3600000) * 3600000; }

  // Mask things that identify people: phones, emails, 14-digit Egyptian national IDs, long digit runs.
  function scrub(text) {
    let hits = 0;
    const rep = (re, s) => { text = text.replace(re, m => { hits++; return s; }); };
    rep(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email removed]');
    rep(/(?<!\d)(?:\+?20|0)?1[0125]\d{8}(?!\d)/g, '[phone removed]');
    rep(/(?<!\d)[23]\d{13}(?!\d)/g, '[ID removed]');
    rep(/(?<!\d)\d{9,}(?!\d)/g, '[number removed]');
    return { text, hits };
  }

  // Trust without identity: independent confirmations from distinct anonymous device tokens.
  function score(i) {
    const conf = (i.confirms || []).length, dis = (i.disputes || []).length;
    return { conf, dis, value: 1 + conf + (i.photo ? 1 : 0) - 1.5 * dis };
  }
  function status(i) {
    if ((i.flags || []).length >= 3) return 'hidden'; // abuse flags: hidden pending review
    if ((i.resolves || []).length >= 3) return 'resolved';
    const s = score(i);
    if (s.dis >= 3 && s.dis > s.conf) return 'disputed';
    return s.value >= VERIFY_AT ? 'verified' : 'pending';
  }
  function randomCode() {
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', b = new Uint8Array(8);
    (root.crypto || require('crypto').webcrypto).getRandomValues(b);
    const s = Array.from(b, x => A[x % A.length]).join('');
    return 'RASD-' + s.slice(0, 4) + '-' + s.slice(4);
  }
  async function sha256(s) {
    const c = root.crypto || require('crypto').webcrypto;
    const d = await c.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(d), x => x.toString(16).padStart(2, '0')).join('');
  }
  const api = { SEV, GRID, VERIFY_AT, CATS, blur, hourBucket, scrub, score, status, randomCode, sha256 };
  if (typeof module !== 'undefined') module.exports = api; else root.RasdCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
