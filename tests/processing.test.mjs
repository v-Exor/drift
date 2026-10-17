import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
await import('../processing.js');
const { decodeFeatures, matchDescriptors, summarize } = globalThis.FeatureLab;
const reference = JSON.parse(readFileSync(new URL('../assets/results/reference.json', import.meta.url), 'utf8'));
test('browser L2/Hamming matching reproduces genuine native OpenCV results for every saved case', () => {
  for (const angle of reference.parameters.angles) for (const [key, raw] of Object.entries(reference.sources)) {
    const first = decodeFeatures(raw), second = decodeFeatures(reference.targets[angle].features[key]);
    const matches = matchDescriptors(first, second, key.startsWith('ORB-'), .75);
    const expected = reference.matches[`${key}@${angle}`];
    assert.deepEqual(matches.map(m => `${m.query}:${m.train}`).sort(), expected.pairs.map(m => `${m[0]}:${m[1]}`).sort(), `${key} @ ${angle} accepted indices`);
    const summary = summarize(first, second, matches, reference.targets[angle].matrix);
    assert.equal(summary.verified, expected.verified, `${key} @ ${angle} geometry`);
  }
});
test('SURF threshold counts are genuine and monotonically decreasing for this image', () => {
  assert.deepEqual(reference.thresholdCounts.map(x => x.keypoints), [547, 141, 49, 21]);
  for (const [key, raw] of Object.entries(reference.sources)) assert.equal(raw.descriptorRows, raw.keypoints.length, key);
});
test('standard and upright SURF share detection positions but differ in descriptors', () => {
  for (const container of [reference.sources, ...Object.values(reference.targets).map(t => t.features)]) {
    const normal = decodeFeatures(container['SURF-400']), upright = decodeFeatures(container['U-SURF-400']);
    assert.deepEqual(normal.keypoints.map(p => [p.x, p.y, p.size]), upright.keypoints.map(p => [p.x, p.y, p.size]));
    assert.notDeepEqual(normal.descriptors, upright.descriptors);
    assert.equal(normal.descriptorColumns, 64); assert.equal(upright.descriptorColumns, 64);
  }
});
test('stricter ratio rejects ambiguous matches and zero descriptors are handled safely', () => {
  const a = decodeFeatures(reference.sources['SURF-400']), b = decodeFeatures(reference.targets[15].features['SURF-400']);
  assert.ok(matchDescriptors(a, b, false, .5).length <= matchDescriptors(a, b, false, .95).length);
  const empty = { keypoints: [], descriptors: [] }; assert.deepEqual(matchDescriptors(empty, empty), []);
  const one = { keypoints: [{}], descriptors: [[0, 1]] }; assert.deepEqual(matchDescriptors(one, one), []);
  const ties = { keypoints: [{}, {}], descriptors: [[0, 1], [0, 1]] }; assert.deepEqual(matchDescriptors(one, ties), []);
});
test('bad ratios, descriptor shapes, and binary values are rejected', () => {
  const good = { keypoints: [{}], descriptors: [[0, 1]] };
  for (const ratio of [NaN, 0, 1, Infinity]) assert.throws(() => matchDescriptors(good, good, false, ratio));
  assert.throws(() => matchDescriptors(good, { keypoints: [], descriptors: [[0]] }));
  assert.throws(() => matchDescriptors({ keypoints: [{}], descriptors: [[300]] }, good, true));
});
