const assert=require('assert'),C=require('./web/core.js');
assert.deepEqual(C.blur(31.2001,29.9187),C.blur(31.2024,29.9199)); // same cell, same blurred point
assert.notEqual(C.blur(31.2001,29.9187).lat,31.2001);
assert.equal(C.scrub('call 01012345678').hits,1);assert.equal(C.scrub('id 29901011234567').hits,1);assert.equal(C.scrub('a@b.co').hits,1);assert.equal(C.scrub('pothole near the school').hits,0);
assert.equal(C.status({confirms:[],disputes:[]}),'pending');
assert.equal(C.status({confirms:[1,2],disputes:[]}),'verified');
assert.equal(C.status({confirms:[1],photo:1,disputes:[]}),'verified');
assert.equal(C.status({confirms:[1],disputes:[1,2,3]}),'disputed');
assert.equal(C.status({confirms:[1,2,3],resolves:[1,2,3]}),'resolved');
assert.equal(C.status({confirms:[1,2,3],flags:[1,2,3]}),'hidden');
assert(/^RASD-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(C.randomCode()));
console.log('core tests passed');
// round 2: Arabic-Indic digits and separated numbers were not scrubbed
{
  const C2 = require('./web/core.js'), a2 = require('assert');
  const s = t => C2.scrub(t).text;
  a2.strictEqual(s('٠١٠١٢٣٤٥٦٧٨'), '[phone removed]');
  a2.strictEqual(s('010 1234 5678'), '[phone removed]');
  a2.strictEqual(s('010-1234-5678'), '[phone removed]');
  a2.strictEqual(s('+20 100 123 4567'), '[phone removed]');
  a2.strictEqual(s('0020 100 123 4567'), '[phone removed]');
  a2.strictEqual(s('الرقم القومي ٢٩٠٠١٠١٠١٢٣٤٥٦'), 'الرقم القومي [ID removed]');
  a2.strictEqual(s('2 9 0 0 1 0 1 0 1 2 3 4 5 6'), '[ID removed]');
  a2.strictEqual(s('on 2026-11-26 14:30 at km 45'), 'on 2026-11-26 14:30 at km 45');
  a2.strictEqual(s('pothole 3 meters, 120 cm deep'), 'pothole 3 meters, 120 cm deep');
  console.log('round-2 scrub tests passed');
}
