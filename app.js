const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const { decodeFeatures, matchDescriptors, summarize } = globalThis.FeatureLab;
const state = { reference: null, surf: null, comparison: null, upright: null, live: null, source: null, worker: null, job: 0, busy: false };
const imageCache = new Map();
let toastTimer, sourceJob = 0;
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => $('#toast').hidden = true, 4000); }
function error(id, message = '') { $(id).textContent = message; $(id).hidden = !message; }
function pause() { return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }
function download(blob, name) { const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
function jsonDownload(value, name) { download(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }), name); }
function loadImage(url) {
  if (!imageCache.has(url)) imageCache.set(url, new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => { imageCache.delete(url); reject(Error('An image could not be loaded. Check your connection and retry.')); }; image.src = url;
  }));
  return imageCache.get(url);
}
function setCanvas(canvas, width, height) { canvas.width = width; canvas.height = height; return canvas.getContext('2d'); }
function points(canvas, image, feature, selected = -1) {
  const ctx = setCanvas(canvas, image.width, image.height); ctx.drawImage(image, 0, 0);
  feature.keypoints.forEach((p, i) => {
    const radius = Math.max(2, p.size / 2), angle = p.angle * Math.PI / 180;
    ctx.strokeStyle = i === selected ? '#fff' : '#ff8c35'; ctx.lineWidth = i === selected ? 3 : 1.25;
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + radius * Math.cos(angle), p.y + radius * Math.sin(angle)); ctx.stroke();
    if (i === selected) { ctx.strokeStyle = '#9c3c00'; ctx.lineWidth = 1; ctx.strokeRect(p.x - radius - 3, p.y - radius - 3, radius * 2 + 6, radius * 2 + 6); }
  });
}
function matchesCanvas(canvas, image1, image2, first, second, matches) {
  const ctx = setCanvas(canvas, image1.width + image2.width, Math.max(image1.height, image2.height));
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image1, 0, 0); ctx.drawImage(image2, image1.width, 0);
  matches.slice(0, 40).forEach((match, i) => {
    const a = first.keypoints[match.query], b = second.keypoints[match.train];
    ctx.strokeStyle = ['#ff9a45', '#fff0d9', '#a9c68d', '#ffc48d'][i % 4]; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + image1.width, b.y); ctx.stroke();
    for (const [x, y] of [[a.x, a.y], [b.x + image1.width, b.y]]) { ctx.beginPath(); ctx.arc(x, y, 2.7, 0, Math.PI * 2); ctx.stroke(); }
  });
}
function stats(container, metrics, timeLabel = 'Saved extraction / pair') {
  container.replaceChildren();
  for (const [label, value] of [['Keypoints · first / target', `${metrics.keypoints1} / ${metrics.keypoints2}`], ['Ratio-test matches', metrics.matches], ['Verified within 3 px', metrics.verified], [timeLabel, `${metrics.extractPairMs.toFixed(2)} ms`]]) {
    const article = document.createElement('div'), span = document.createElement('span'), strong = document.createElement('strong'); span.textContent = label; strong.textContent = value; article.append(span, strong); container.append(article);
  }
}
function featurePair(name, angle, threshold = 400, ratio = .75) {
  const key = `${name}-${threshold}`, first = state.reference.sources[key], target = state.reference.targets[String(angle)], second = target.features[key];
  const start = performance.now(), matches = matchDescriptors(first, second, name === 'ORB', ratio), matchingMs = performance.now() - start;
  return { name, angle, threshold, ratio, first, second, matrix: target.matrix, matches, matchingMs, metrics: summarize(first, second, matches, target.matrix) };
}
async function referenceImages(angle) { return Promise.all([loadImage('./assets/results/source.png'), loadImage(`./assets/results/target-${angle}.png`)]); }
function inspectPoint(index) {
  if (!state.surf) return;
  index = Math.max(0, Math.min(state.surf.first.keypoints.length - 1, Math.trunc(index) || 0));
  $('#point-index').value = index; $('#point-index').max = state.surf.first.keypoints.length - 1;
  const point = state.surf.first.keypoints[index], descriptor = state.surf.first.descriptors[index];
  $('#point-info').textContent = `Point ${index} · x ${point.x.toFixed(1)}, y ${point.y.toFixed(1)} · size ${point.size.toFixed(1)} px · angle ${point.angle.toFixed(1)}°`;
  const grid = $('#descriptor-grid'); grid.replaceChildren();
  for (let cell = 0; cell < 16; cell++) {
    const div = document.createElement('div');
    div.textContent = descriptor.slice(cell * 4, cell * 4 + 4).map(x => x.toFixed(3)).join('\n');
    div.title = `Cell ${cell + 1}: sum dx, sum dy, sum |dx|, sum |dy|`; grid.append(div);
  }
  points($('#surf-keypoints'), state.surf.images[0], state.surf.first, index);
}
async function runSurf() {
  if (!state.reference) return;
  const button = $('#run-surf'); button.disabled = true; $('#surf-status').textContent = 'Matching saved SURF descriptors…';
  try {
    await pause();
    const result = featurePair('SURF', Number($('#surf-angle').value), Number($('#surf-threshold').value), Number($('#surf-ratio').value));
    result.images = await referenceImages(result.angle); state.surf = result;
    $('#surf-output').hidden = false; inspectPoint(0);
    matchesCanvas($('#surf-matches'), ...result.images, result.first, result.second, result.matches);
    stats($('#surf-stats'), result.metrics);
    $('#surf-status').textContent = `Hessian ${result.threshold} · ${result.angle}° · ratio ${result.ratio.toFixed(2)} · ${result.metrics.matches} matches · ${result.matchingMs.toFixed(1)} ms live matching`;
  } catch (e) { $('#surf-status').textContent = e.message; }
  finally { button.disabled = false; }
}
function gallery(container, results, images) {
  container.replaceChildren();
  for (const result of results) {
    const figure = document.createElement('figure'), canvas = document.createElement('canvas'), caption = document.createElement('figcaption'), title = document.createElement('strong'), detail = document.createElement('span');
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `${result.name} matches from genuine saved detections`);
    matchesCanvas(canvas, ...images, result.first, result.second, result.matches);
    title.textContent = result.name; detail.textContent = `${result.metrics.matches} candidates · ${result.metrics.verified} verified`;
    caption.append(title, detail); figure.append(canvas, caption); container.append(figure);
  }
}
function table(container, results, caption) {
  const wrapper = document.createElement('div'); wrapper.className = 'table-wrap'; wrapper.tabIndex = 0; wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', caption);
  const table = document.createElement('table'), title = document.createElement('caption'), head = document.createElement('thead'), body = document.createElement('tbody'), tr = document.createElement('tr');
  title.textContent = caption;
  for (const text of ['Algorithm', 'Keypoints 1 / 2', 'Matches', 'Verified ≤3 px', 'Agreement', 'Saved extraction / pair']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; tr.append(th); } head.append(tr);
  for (const r of results) {
    const row = document.createElement('tr'), m = r.metrics;
    for (const value of [r.name, `${m.keypoints1} / ${m.keypoints2}`, m.matches, m.verified, m.precision === null ? '—' : `${(m.precision * 100).toFixed(1)}%`, `${m.extractPairMs.toFixed(2)} ms`]) { const td = document.createElement('td'); td.textContent = value; row.append(td); } body.append(row);
  }
  table.append(title, head, body); wrapper.append(table); container.replaceChildren(wrapper);
}
async function runComparison() {
  if (!state.reference) return;
  const button = $('#run-compare'); button.disabled = true; $('#compare-status').textContent = 'Comparing saved feature sets…';
  try {
    await pause(); const angle = Number($('#compare-angle').value), ratio = Number($('#compare-ratio').value);
    const results = ['SURF', 'SIFT', 'ORB'].map(name => featurePair(name, angle, 400, ratio)), images = await referenceImages(angle);
    state.comparison = { angle, ratio, results };
    gallery($('#compare-gallery'), results, images); table($('#compare-table'), results, `Same cat pair · ${angle}° · scale 0.85 · ratio ${ratio.toFixed(2)} · genuine saved OpenCV features`);
    $('#compare-status').textContent = `Completed: ${angle}° · ratio ${ratio.toFixed(2)} · saved detection, live descriptor matching`;
    for (const r of results) $(`#metric-${r.name.toLowerCase()}`).textContent = r.metrics.matches;
    const surf = results[0].metrics;
    $('#metric-precision').textContent = surf.precision === null ? '—' : `${(surf.precision * 100).toFixed(1)}%`;
    $('#results-context').textContent = `Latest Task 2 result · included grayscale cat · ${angle}° rotation · scale 0.85 · shift (+15, +10) · ratio ${ratio.toFixed(2)}.`;
    $('#comparison-observation').textContent = `SURF accepted ${surf.matches} candidate matches; ${surf.verified} agree with the known transform within 3 px. A larger count alone does not establish better performance. Compare the same inputs, descriptor type, thresholds, and timing environment.`;
    $('#download-comparison').disabled = false; $('#export-results').disabled = false;
  } catch (e) { $('#compare-status').textContent = e.message; }
  finally { button.disabled = false; }
}
async function runUpright() {
  if (!state.reference) return;
  const button = $('#run-upright'); button.disabled = true; $('#upright-status').textContent = 'Comparing oriented and upright descriptors…';
  try {
    await pause(); const angle = Number($('#upright-angle').value), ratio = Number($('#upright-ratio').value), results = ['SURF', 'U-SURF'].map(name => featurePair(name, angle, 400, ratio));
    const images = await referenceImages(angle); state.upright = { angle, ratio, results };
    gallery($('#upright-gallery'), results, images); table($('#upright-table'), results, `SURF vs U-SURF · ${angle}° · Hessian 400 · ratio ${ratio.toFixed(2)}`);
    $('#upright-status').textContent = `Completed at ${angle}° · saved OpenCV orientation modes`;
    $('#upright-observation').textContent = `At ${angle}°, standard SURF has ${results[0].metrics.verified} geometrically verified matches and U-SURF has ${results[1].metrics.verified}. Both use the same ${results[0].metrics.keypoints1} source detection locations. Upright mode removes orientation estimation; compare the 0° and 90° settings to inspect its rotation tradeoff.`;
  } catch (e) { $('#upright-status').textContent = e.message; }
  finally { button.disabled = false; }
}
for (const [form, handler] of [['#surf-form', runSurf], ['#compare-form', runComparison], ['#upright-form', runUpright]]) $(form).addEventListener('submit', e => { e.preventDefault(); handler(); });
$('#point-index').addEventListener('input', e => inspectPoint(Number(e.target.value)));
$('#surf-keypoints').addEventListener('click', e => {
  if (!state.surf) return;
  const box = e.currentTarget.getBoundingClientRect(), x = (e.clientX - box.left) * e.currentTarget.width / box.width, y = (e.clientY - box.top) * e.currentTarget.height / box.height;
  let nearest = 0, best = Infinity; state.surf.first.keypoints.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; nearest = i; } }); inspectPoint(nearest);
});
$('#download-descriptor').addEventListener('click', () => { if (state.surf) { const index = Number($('#point-index').value); jsonDownload({ engine: state.reference.engine, source: 'Included cat · saved genuine SURF', threshold: state.surf.threshold, index, keypoint: state.surf.first.keypoints[index], descriptor: state.surf.first.descriptors[index] }, 'surf-descriptor.json'); } });
for (const [input, output, suffix] of [['surf-ratio', 'surf-ratio-value', ''], ['compare-ratio', 'compare-ratio-value', ''], ['upright-ratio', 'upright-ratio-value', ''], ['orb-angle', 'orb-angle-value', '°'], ['orb-scale', 'orb-scale-value', '']]) $(`#${input}`).addEventListener('input', e => { $(`#${output}`).textContent = (suffix ? Number(e.target.value) : Number(e.target.value).toFixed(2)) + suffix; });
for (const [form, status] of [['surf-form', 'surf-status'], ['compare-form', 'compare-status'], ['upright-form', 'upright-status']]) $(`#${form}`).addEventListener('change', () => { $(`#${status}`).textContent = 'Settings changed. Run again to update the displayed results.'; });
for (const button of $$('[data-canvas]')) button.addEventListener('click', () => { const canvas = $(`#${button.dataset.canvas}`); if (canvas.width > 1) canvas.toBlob(blob => { if (blob) download(blob, `${button.dataset.canvas}.png`); }); });
function compact(r) { return r ? { algorithm: r.name, angle: r.angle, threshold: r.threshold, ratio: r.ratio, metrics: r.metrics, browserMatchingMs: r.matchingMs } : null; }
$('#export-results').addEventListener('click', () => jsonDownload({ laboratory: 'CSST106 Lab 4', provenance: 'Saved genuine OpenCV 3.4.2 detection; browser descriptor matching', benchmark: state.reference.benchmark, task1: compact(state.surf), task2: state.comparison?.results.map(compact), task3: state.upright?.results.map(compact), liveOrb: state.live ? { ...state.live.report } : null }, 'lab4-comparisons.json'));
$('#download-comparison').addEventListener('click', () => {
  if (!state.comparison) return;
  const rows = [['Algorithm', 'Angle', 'Ratio', 'Keypoints1', 'Keypoints2', 'Matches', 'Verified3px', 'ExtractPair_ms'], ...state.comparison.results.map(r => [r.name, r.angle, r.ratio, r.metrics.keypoints1, r.metrics.keypoints2, r.metrics.matches, r.metrics.verified, r.metrics.extractPairMs])];
  download(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }), 'lab4-detector-comparison.csv');
});
async function initializeReference() {
  error('#reference-error'); $('#retry-reference').hidden = true;
  try {
    const response = await fetch('./assets/results/reference.json'); if (!response.ok) throw Error('Saved feature data could not be loaded.');
    const reference = await response.json();
    for (const key of Object.keys(reference.sources)) reference.sources[key] = decodeFeatures(reference.sources[key]);
    for (const target of Object.values(reference.targets)) for (const key of Object.keys(target.features)) target.features[key] = decodeFeatures(target.features[key]);
    state.reference = reference; $('#reference-state').textContent = 'OpenCV reference data ready';
    for (const button of $$('.reference-action')) button.disabled = false;
    const chart = $('#threshold-chart'); chart.replaceChildren();
    for (const row of reference.thresholdCounts) { const div = document.createElement('div'), label = document.createElement('span'), bar = document.createElement('i'), value = document.createElement('strong'); label.textContent = row.threshold; value.textContent = `${row.keypoints} points`; bar.style.setProperty('--bar', `${row.keypoints / reference.thresholdCounts[0].keypoints * 100}%`); div.append(label, bar, value); chart.append(div); }
    await runSurf(); await runComparison(); await runUpright();
  } catch (e) { $('#reference-state').textContent = 'Reference data unavailable'; error('#reference-error', e.message + ' The saved gallery and Python download remain available.'); $('#retry-reference').hidden = false; }
}
$('#retry-reference').addEventListener('click', initializeReference);
async function setSource(blob, name) {
  const token = ++sourceJob; error('#orb-error');
  if (state.busy) cancelOrb('Processing cancelled because the input changed.');
  $('#run-orb').disabled = true;
  try {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size > 15 * 1024 * 1024) throw Error('Choose a JPEG, PNG, or WebP image smaller than 15 MiB.');
    const bitmap = await createImageBitmap(blob);
    try {
      if (bitmap.width * bitmap.height > 40000000) throw Error('Image exceeds 40 million pixels. Resize it before uploading.');
      if (Math.min(bitmap.width, bitmap.height) < 32) throw Error('Image must be at least 32 pixels on each side.');
      const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height)), canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      if (Math.min(canvas.width, canvas.height) < 32) throw Error('The resized image is too narrow. Choose a less elongated image.');
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      if (token !== sourceJob) return;
      state.source = { name, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height) }; state.live = null; $('#orb-output').hidden = true;
      $('#source-name').textContent = name; $('#source-info').textContent = `${canvas.width} × ${canvas.height} processing pixels · local only · affects the live ORB module`;
      $('#orb-status').textContent = 'Image ready. Run live ORB to detect new features.'; $('#run-orb').disabled = false;
    } finally { bitmap.close(); }
  } catch (e) { if (token !== sourceJob) return; error('#orb-error', e.message); $('#run-orb').disabled = !state.source; $('#orb-status').textContent = state.source ? 'Previous input retained.' : 'Choose a valid image.'; }
}
async function sample() {
  try { const response = await fetch('./assets/cat.jpg'); if (!response.ok) throw Error('The cat sample could not be loaded.'); await setSource(await response.blob(), 'Included cat photograph'); }
  catch (e) { error('#orb-error', e.message); }
}
$('#choose-image').addEventListener('click', () => $('#image-upload').click());
$('#image-upload').addEventListener('change', e => { if (e.target.files[0]) setSource(e.target.files[0], e.target.files[0].name); e.target.value = ''; });
$('#use-sample').addEventListener('click', sample);
for (const event of ['dragenter', 'dragover']) $('#drop-zone').addEventListener(event, e => { e.preventDefault(); $('#drop-zone').classList.add('dragging'); });
for (const event of ['dragleave', 'drop']) $('#drop-zone').addEventListener(event, e => { e.preventDefault(); $('#drop-zone').classList.remove('dragging'); });
$('#drop-zone').addEventListener('drop', e => { const file = e.dataTransfer.files[0]; if (file) setSource(file, file.name); });
function grayCanvas(bytes, width, height) { const canvas = document.createElement('canvas'), ctx = setCanvas(canvas, width, height), data = ctx.createImageData(width, height); for (let i = 0; i < bytes.length; i++) { data.data[i * 4] = data.data[i * 4 + 1] = data.data[i * 4 + 2] = bytes[i]; data.data[i * 4 + 3] = 255; } ctx.putImageData(data, 0, 0); return canvas; }
function finishOrb() { state.busy = false; clearTimeout(state.timeout); $('#run-orb').disabled = !state.source; $('#cancel-orb').hidden = true; }
function cancelOrb(message = 'Processing cancelled. You can run it again.') { state.job++; state.worker?.terminate(); state.worker = null; finishOrb(); $('#orb-status').textContent = message; }
$('#cancel-orb').addEventListener('click', () => cancelOrb());
$('#orb-form').addEventListener('submit', e => {
  e.preventDefault(); if (!state.source || state.busy) return;
  error('#orb-error'); state.busy = true; const id = ++state.job, sourceName = state.source.name;
  $('#run-orb').disabled = true; $('#cancel-orb').hidden = false; $('#orb-status').textContent = 'Loading OpenCV (~11 MB on first run), then extracting ORB features…';
  try {
    if (!state.worker) state.worker = new Worker('./worker.js');
    state.worker.onmessage = ({ data }) => {
      if (data.id !== state.job) return;
      if (data.type === 'error') { finishOrb(); error('#orb-error', data.message); $('#orb-status').textContent = 'Processing failed. Try another image or retry.'; return; }
      try {
        const r = data.result, start = performance.now(), matches = matchDescriptors(r.first, r.second, true, .75), matchingMs = performance.now() - start, metrics = summarize(r.first, r.second, matches, r.matrix);
        const firstImage = grayCanvas(r.gray, r.width, r.height), secondImage = grayCanvas(r.target, r.width, r.height);
        for (const [id, image] of [['orb-original', firstImage], ['orb-target', secondImage]]) { const canvas = $(`#${id}`), ctx = setCanvas(canvas, r.width, r.height); ctx.drawImage(image, 0, 0); }
        matchesCanvas($('#orb-matches'), firstImage, secondImage, r.first, r.second, matches); stats($('#orb-stats'), metrics, 'Live extraction / pair');
        const report = { engine: r.engine, source: sourceName, width: r.width, height: r.height, parameters: { ...r.parameters, ratio: .75, translation: [15, 10] }, metrics, matchingMs, benchmark: 'One warmup + three runs per image; sum of per-image medians; excludes loading, matching and drawing.' };
        state.live = { report }; $('#orb-output').hidden = false;
        $('#orb-status').textContent = matches.length ? `Live ORB completed · ${matches.length} candidate matches · ${metrics.verified} verified` : 'Live ORB completed: no accepted matches. Try an image with more texture or a gentler transform.';
        $('#orb-caption').textContent = `${sourceName} · ${r.parameters.angle}° · scale ${r.parameters.scale} · ratio 0.75 · actual browser ORB · ${matchingMs.toFixed(2)} ms matching · up to 40 lines shown.`;
      } catch (errorValue) { error('#orb-error', errorValue.message); }
      finishOrb();
    };
    state.worker.onerror = () => { cancelOrb('The OpenCV worker stopped. Retry processing.'); error('#orb-error', 'OpenCV could not load or the worker failed. Serve the site over HTTP and check the bundled runtime asset.'); };
    state.timeout = setTimeout(() => { cancelOrb('Processing timed out. Retry or use a smaller image.'); error('#orb-error', 'OpenCV loading or processing exceeded 90 seconds.'); }, 90000);
    const image = state.source.pixels;
    state.worker.postMessage({ type: 'orb', id, rgba: image.data.slice().buffer, width: image.width, height: image.height, angle: Number($('#orb-angle').value), scale: Number($('#orb-scale').value), maxFeatures: Number($('#orb-features').value) });
  } catch (e) { cancelOrb('Unable to start processing.'); error('#orb-error', e.message); }
});
$('#download-orb').addEventListener('click', () => { if (state.live) jsonDownload(state.live.report, 'lab4-live-orb.json'); });
try { $('#observation-notes').value = localStorage.getItem('csst106-lab04-notes') || ''; } catch {}
$('#observation-notes').addEventListener('input', () => { try { localStorage.setItem('csst106-lab04-notes', $('#observation-notes').value); $('#notes-status').textContent = 'Saved in this browser.'; } catch { $('#notes-status').textContent = 'Download your notes to keep them.'; } });
$('#download-notes').addEventListener('click', () => download(new Blob([`# CSST106 Lab 4 — Observations\n\n${$('#observation-notes').value || 'No personal notes entered.'}\n\n${$('#results-context').textContent}\n${$('#comparison-observation').textContent}\n`], { type: 'text/markdown' }), 'lab4-observations.md'));
let pythonSource = '';
fetch('./python/surf_lab.py').then(r => { if (!r.ok) throw Error(); return r.text(); }).then(text => { pythonSource = text; $('#python-code').textContent = text; $('#copy-code').disabled = false; }).catch(() => $('#python-code').textContent = 'Preview unavailable. Download the Python kit above.');
$('#copy-code').addEventListener('click', async () => { try { await navigator.clipboard.writeText(pythonSource); toast('Python code copied.'); } catch { const range = document.createRange(); range.selectNodeContents($('#python-code')); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Code selected. Press Ctrl+C or Command+C.'); } });
let stored = {}; try { stored = JSON.parse(localStorage.getItem('csst106-lab04-links') || '{}') || {}; } catch {}
let config = { compilationUrl: '', repositoryUrl: '', ...window.LAB_CONFIG, ...stored };
function validUrl(value) { if (!value) return ''; const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw Error('Use a complete HTTP or HTTPS address.'); return url.href; }
function openSettings() { $('#compilation-url').value = config.compilationUrl || ''; $('#repository-url').value = config.repositoryUrl || ''; error('#link-error'); $('#link-dialog').showModal(); }
for (const button of $$('[data-destination]')) button.addEventListener('click', () => { const key = button.dataset.destination === 'repository' ? 'repositoryUrl' : 'compilationUrl'; try { const url = validUrl(config[key]); if (!url) openSettings(); else if (key === 'repositoryUrl') window.open(url, '_blank', 'noopener,noreferrer'); else location.assign(url); } catch { openSettings(); } });
$('#open-settings').addEventListener('click', openSettings); $('#close-dialog').addEventListener('click', () => $('#link-dialog').close());
function formConfig() { return { compilationUrl: validUrl($('#compilation-url').value.trim()), repositoryUrl: validUrl($('#repository-url').value.trim()) }; }
$('#link-form').addEventListener('submit', e => { e.preventDefault(); try { config = formConfig(); try { localStorage.setItem('csst106-lab04-links', JSON.stringify(config)); toast('Links saved for this browser.'); } catch { toast('Links applied for this visit.'); } $('#link-dialog').close(); } catch (e) { error('#link-error', e.message); } });
$('#download-config').addEventListener('click', () => { try { download(new Blob([`window.LAB_CONFIG = ${JSON.stringify(formConfig(), null, 2)};\n`], { type: 'text/javascript' }), 'site-config.js'); } catch (e) { error('#link-error', e.message); } });
$('#menu-toggle').addEventListener('click', () => { const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true'; $('#menu-toggle').setAttribute('aria-expanded', String(open)); $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); $('#main-nav').classList.toggle('open', open); });
function closeMenu() { $('#main-nav').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); $('#menu-toggle').setAttribute('aria-label', 'Open navigation'); }
for (const link of $$('#main-nav a')) link.addEventListener('click', closeMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); } }, { threshold: .08 });
  for (const element of $$('.reveal')) { element.classList.add('will-reveal'); reveal.observe(element); }
  const navigation = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) for (const link of $$('#main-nav a')) { const active = link.hash === `#${entry.target.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); } }, { rootMargin: '-15% 0px -65% 0px' });
  for (const id of ['home', 'overview', 'objectives', 'experiments', 'results', 'conclusion']) navigation.observe($(`#${id}`));
}
initializeReference(); sample();
