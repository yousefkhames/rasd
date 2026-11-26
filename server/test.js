const assert = require('assert'); process.env.RASD_DB = '/tmp/rasd-test.json'; require('fs').rmSync('/tmp/rasd-test.json', { force: true });
const server = require('./server'); const C = require('../web/core.js');
server.listen(0, async () => {
  const base = 'http://127.0.0.1:' + server.address().port;
  const j = (p, o) => fetch(base + p, o).then(async r => [r.status, await r.json()]);
  const post = (p, b) => j(p, { method: 'POST', body: JSON.stringify(b) });
  let [s, r] = await post('/api/incidents', { cat: 'road', lat: 31.2001, lng: 29.9187, text: 'Pothole, call me 01012345678', photo: false });
  assert.equal(s, 201); assert(!r.incident.text.includes('0101')); assert.notEqual(r.incident.lat, 31.2001);
  const id = r.incident.id, code = r.code;
  for (let k = 0; k < 2; k++) await post(`/api/incidents/${id}/confirm`, { token: 'device-token-number-' + k });
  [s, r] = await post(`/api/incidents/${id}/confirm`, { token: 'device-token-number-0' }); assert.equal(s, 409);
  [s, r] = await post(`/api/incidents/${id}/confirm`, { token: 'device-token-number-9' }); assert.equal(r.status, 'verified');
  [s, r] = await j('/api/track/' + code); assert.equal(s, 200); assert.equal(r.id, id);
  assert(!require('fs').readFileSync('/tmp/rasd-test.json', 'utf8').includes(code), 'plain code must not be stored');
  [s] = await post('/api/incidents', { cat: 'x' }); assert.equal(s, 400);
  console.log('all tests passed'); server.close();
});
