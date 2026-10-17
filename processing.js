/* Real descriptor matching shared by the interface, worker, and tests. */
(() => {
  'use strict';
  const popcount = Uint8Array.from({ length: 256 }, (_, i) => {
    let n = i, count = 0;
    while (n) { n &= n - 1; count++; }
    return count;
  });
  function validateFeatures(features, binary) {
    if (!features || !Array.isArray(features.keypoints) || !Array.isArray(features.descriptors) || features.descriptors.length !== features.keypoints.length || features.keypoints.length > 3000) throw Error('Invalid feature data.');
    let columns = features.descriptors[0]?.length || 0;
    for (const d of features.descriptors) {
      if (!Array.isArray(d) || d.length !== columns || d.length > 128 || d.some(x => !Number.isFinite(x) || (binary && (x < 0 || x > 255 || !Number.isInteger(x))))) throw Error('Invalid descriptor values.');
    }
    return columns;
  }
  function decodeFeatures(record) {
    if (record.descriptors) return record;
    const bytes = Uint8Array.from(atob(record.descriptorData), c => c.charCodeAt(0));
    const values = record.descriptorType === 'uint8' ? bytes : null;
    const view = new DataView(bytes.buffer);
    const descriptors = Array.from({ length: record.descriptorRows }, (_, i) => Array.from({ length: record.descriptorColumns }, (_, j) => {
      const index = i * record.descriptorColumns + j;
      return values ? values[index] : view.getFloat32(index * 4, true);
    }));
    return { ...record, descriptors };
  }
  function matchDescriptors(first, second, binary = false, ratio = .75) {
    if (!Number.isFinite(ratio) || ratio < .5 || ratio > .95) throw Error('Ratio must be between 0.50 and 0.95.');
    const columns1 = validateFeatures(first, binary), columns2 = validateFeatures(second, binary);
    if (!first.descriptors.length || second.descriptors.length < 2) return [];
    if (columns1 !== columns2 || !columns1) throw Error('Descriptor dimensions differ.');
    const good = [];
    for (let q = 0; q < first.descriptors.length; q++) {
      const query = first.descriptors[q];
      let best = Infinity, next = Infinity, train = -1;
      for (let t = 0; t < second.descriptors.length; t++) {
        const candidate = second.descriptors[t];
        let distance = 0;
        for (let j = 0; j < query.length; j++) {
          if (binary) distance += popcount[query[j] ^ candidate[j]];
          else { const delta = query[j] - candidate[j]; distance += delta * delta; }
        }
        if (distance < best) { next = best; best = distance; train = t; }
        else if (distance < next) next = distance;
      }
      if (best < (binary ? ratio : ratio * ratio) * next) good.push({ query: q, train, distance: binary ? best : Math.sqrt(best) });
    }
    return good.sort((a, b) => a.distance - b.distance || a.query - b.query);
  }
  function project(matrix, point) {
    return { x: matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2], y: matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2] };
  }
  function summarize(first, second, matches, matrix) {
    let verified = 0;
    for (const match of matches) {
      const expected = project(matrix, first.keypoints[match.query]), actual = second.keypoints[match.train];
      if (Math.hypot(expected.x - actual.x, expected.y - actual.y) <= 3) verified++;
    }
    return { keypoints1: first.keypoints.length, keypoints2: second.keypoints.length, matches: matches.length,
      verified, precision: matches.length ? verified / matches.length : null,
      extractPairMs: first.extractMs + second.extractMs, descriptorColumns: first.descriptorColumns };
  }
  globalThis.FeatureLab = { matchDescriptors, project, summarize, validateFeatures, decodeFeatures };
})();
