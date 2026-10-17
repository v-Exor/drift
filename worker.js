importScripts('./processing.js');
let ready;
function engine() {
  if (!ready) ready = new Promise((resolve, reject) => {
    try {
      importScripts('./assets/vendor/opencv.js');
      const module = self.cv;
      if (module?.Mat) resolve({ cv: module });
      else if (typeof module?.then === 'function') module.then(cv => resolve({ cv }), reject);
      else if (module) module.onRuntimeInitialized = () => resolve({ cv: module });
      else reject(Error('OpenCV did not initialize.'));
    } catch (error) { reject(error); }
  });
  return ready;
}
function extract(cv, image, maxFeatures) {
  let detector, points, descriptors, mask;
  try {
    detector = new cv.ORB(maxFeatures);
    points = new cv.KeyPointVector(); descriptors = new cv.Mat(); mask = new cv.Mat();
    detector.detectAndCompute(image, mask, points, descriptors);
    const times = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now(); detector.detectAndCompute(image, mask, points, descriptors); times.push(performance.now() - start);
    }
    const keypoints = [], values = [];
    for (let i = 0; i < points.size(); i++) {
      const p = points.get(i);
      keypoints.push({ x: p.pt.x, y: p.pt.y, size: p.size, angle: p.angle, response: p.response });
      values.push(Array.from(descriptors.data.subarray(i * descriptors.cols, (i + 1) * descriptors.cols)));
    }
    return { keypoints, descriptors: values, descriptorColumns: descriptors.cols, extractMs: times.sort((a, b) => a - b)[1] };
  } finally { for (const value of [detector, points, descriptors, mask]) value?.delete(); }
}
self.onmessage = async ({ data }) => {
  if (data.type !== 'orb') return;
  let rgba, gray, target, transform;
  try {
    const { cv } = await engine();
    const { width, height, angle, scale, maxFeatures } = data;
    if (!Number.isInteger(width) || !Number.isInteger(height) || Math.min(width, height) < 32 || Math.max(width, height) > 640 || data.rgba.byteLength !== width * height * 4) throw Error('Choose an image with valid dimensions, at least 32 × 32 pixels.');
    if (!Number.isFinite(angle) || Math.abs(angle) > 90 || !Number.isFinite(scale) || scale < .5 || scale > 1 || ![500, 1000, 1500].includes(maxFeatures)) throw Error('Invalid ORB parameters.');
    rgba = cv.matFromArray(height, width, cv.CV_8UC4, new Uint8Array(data.rgba));
    gray = new cv.Mat(); cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
    transform = cv.getRotationMatrix2D(new cv.Point(width / 2, height / 2), angle, scale);
    transform.data64F[2] += 15; transform.data64F[5] += 10;
    target = new cv.Mat();
    cv.warpAffine(gray, target, transform, new cv.Size(width, height), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255));
    const matrix = [Array.from(transform.data64F.subarray(0, 3)), Array.from(transform.data64F.subarray(3, 6))];
    const first = extract(cv, gray, maxFeatures), second = extract(cv, target, maxFeatures);
    const result = { width, height, first, second, matrix, gray: new Uint8Array(gray.data), target: new Uint8Array(target.data), parameters: { angle, scale, maxFeatures }, engine: 'OpenCV.js 4.12.0 · ORB · live browser extraction' };
    self.postMessage({ type: 'result', id: data.id, result }, [result.gray.buffer, result.target.buffer]);
  } catch (error) { self.postMessage({ type: 'error', id: data.id, message: typeof error === 'number' ? 'OpenCV could not process this image. Try a different image.' : String(error.message || error) }); }
  finally { for (const value of [rgba, gray, target, transform]) value?.delete(); }
};
