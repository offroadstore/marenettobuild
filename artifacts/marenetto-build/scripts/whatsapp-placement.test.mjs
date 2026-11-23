import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappPlacement } from '../src/lib/whatsapp-placement.ts';

const viewport = { width: 390, height: 780 };
const preferred = { left: 298, top: 622, width: 72, height: 72 };
const header = { left: 0, top: 0, width: 390, height: 72 };
test('keeps the original corner when clear', () => {
  assert.deepEqual(whatsappPlacement(preferred, [header], viewport), { left: 298, top: 622 });
});
test('moves above readable content without leaving the viewport', () => {
  const text = { left: 20, top: 620, width: 350, height: 100 };
  const place = whatsappPlacement(preferred, [header, text], viewport);
  assert.deepEqual(place, { left: 298, top: 543 });
  assert.ok(place.top + 72 <= text.top - 5);
});
test('a drag to the header lands below it rather than hiding the control', () => {
  assert.deepEqual(whatsappPlacement({ ...preferred, left: 0, top: 0 }, [header], viewport), { left: 0, top: 77 });
});
test('a full-screen dialog still hides the floating action', () => {
  assert.equal(whatsappPlacement(preferred, [{ left: 0, top: 0, ...viewport }], viewport), null);
});
test('uses a free central slot when both screen edges are occupied', () => {
  const place = whatsappPlacement(preferred, [
    { left: 0, top: 0, width: 130, height: 780 },
    { left: 240, top: 0, width: 150, height: 780 },
  ], viewport);
  assert.deepEqual(place, { left: 163, top: 622 });
});
test('ignores offscreen and zero-sized content; clamps offscreen preferred positions', () => {
  assert.deepEqual(whatsappPlacement({ ...preferred, left: -100, top: -100 },
    [{ left: 0, top: 800, width: 390, height: 200 }, { left: 0, top: 0, width: 0, height: 0 }], viewport),
  { left: 0, top: 0 });
});
test('cannot place a control in a viewport smaller than the control', () => {
  assert.equal(whatsappPlacement(preferred, [], { width: 60, height: 60 }), null);
});
