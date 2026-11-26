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
    // Digit runs, also with spaces, dashes or brackets between groups and in Arabic-Indic or Persian digits.
    const norm = x => x.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776);
    const D = '[\\d٠-٩۰-۹]';
    const run = new RegExp('(?<!' + D + ')\\+?' + D + '(?:[ \\-()]{0,2}' + D + '){8,}(?!' + D + ')', 'g');
    text = text.replace(run, m => {
      const n = norm(m), d = n.replace(/\D/g, ''), sep = /[^\d٠-٩۰-۹+]/.test(m);
      if (sep && (d.length < 10 || /^\d{4}-\d{2}-\d{2}/.test(n))) return m; // short or a plain date: leave alone
      hits++;
      if (/^(?:00?20|20|0)?1[0125]\d{8}$/.test(d)) return '[phone removed]';
      if (d.length === 14 && /^[23]/.test(d)) return '[ID removed]';
      return '[number removed]';
    });
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
