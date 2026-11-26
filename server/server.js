// Rasd API: zero-dependency Node server. Stores no IPs, no user agents, no accounts.
const http = require('http'), fs = require('fs'), path = require('path');
const C = require('../web/core.js');
const FILE = process.env.RASD_DB || path.join(__dirname, 'data.json');
const db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { incidents: [], codes: {} };
const save = () => fs.writeFileSync(FILE, JSON.stringify(db));
const pub = i => ({ id: i.id, cat: i.cat, lat: i.lat, lng: i.lng, text: i.text, ts: i.ts, photo: i.photo, sev: i.sev || 1, status: C.status(i), score: C.score(i) });
const body = req => new Promise(r => { let b = ''; req.on('data', c => (b += c, b.length > 2e5 && req.destroy())); req.on('end', () => r(JSON.parse(b || '{}'))); });
const send = (res, code, o) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    const u = new URL(req.url, 'http://x');
    if (req.method === 'GET' && u.pathname === '/api/incidents') return send(res, 200, db.incidents.map(pub));
    if (req.method === 'POST' && u.pathname === '/api/incidents') {
      const b = await body(req);
      if (!C.CATS.includes(b.cat) || typeof b.text !== 'string' || b.text.length < 8 || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return send(res, 400, { error: 'invalid' });
      const code = C.randomCode(), loc = C.blur(b.lat, b.lng); // server re-blurs: never trusts the client
      const i = { id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), cat: b.cat, ...loc, text: C.scrub(b.text.slice(0, 500)).text, ts: C.hourBucket(Date.now()), confirms: [], disputes: [], resolves: [], flags: [], sev: [0, 1, 2].includes(b.sev) ? b.sev : 1, photo: b.photo ? 1 : 0 };
      db.incidents.push(i); db.codes[await C.sha256(code)] = i.id; save();
      return send(res, 201, { code, incident: pub(i) });
    }
    let m;
    if (req.method === 'POST' && (m = u.pathname.match(/^\/api\/incidents\/([\w-]+)\/(confirm|dispute|resolve|flag)$/))) {
      const i = db.incidents.find(x => x.id === m[1]); if (!i) return send(res, 404, { error: 'not found' });
      const { token } = await body(req); if (typeof token !== 'string' || token.length < 16) return send(res, 400, { error: 'token' });
      const h = await C.sha256(token + ':' + i.id); // salted per incident so tokens cannot be linked across reports
      i.resolves = i.resolves || []; i.flags = i.flags || [];
      if ([i.confirms, i.disputes, i.resolves, i.flags].some(a => a.includes(h))) return send(res, 409, { error: 'already voted' });
      ({ confirm: i.confirms, dispute: i.disputes, resolve: i.resolves, flag: i.flags })[m[2]].push(h); save(); return send(res, 200, pub(i));
    }
    if (req.method === 'GET' && (m = u.pathname.match(/^\/api\/track\/([\w-]+)$/))) {
      const id = db.codes[await C.sha256(m[1].toUpperCase())]; const i = db.incidents.find(x => x.id === id);
      return i ? send(res, 200, pub(i)) : send(res, 404, { error: 'not found' });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 400, { error: 'bad request' }); }
});
if (require.main === module) server.listen(process.env.PORT || 8787, () => console.log('Rasd API on', server.address().port));
module.exports = server;
