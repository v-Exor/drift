# CSST106 Lab 4 SURF Feature Detection

An independent, buildless GitHub Pages website for Laboratory Exercise No. 4.
The white/orange VisionLab theme matches Labs 1–3 in the compilation. No school
logos are used. The independent repository is
https://github.com/v-Exor/LabAct4_CSST106. See DEPLOYMENT.md for the website
address and compilation integration.

## What works

- Task 1: genuine saved SURF keypoints/descriptors at Hessian thresholds 100,
  400, 1000, 2000; orientation/scale visualization; point/descriptor inspector;
  real browser L2 matching with an adjustable ratio and known-transform checks.
- Task 2: SURF, SIFT and ORB on exactly the same cat pairs at 0°, 15°, 45°, 90°;
  actual keypoint counts, descriptor matching, geometric agreement, native
  extraction times, CSV and JSON export.
- Task 3: genuine standard and upright SURF descriptors, rotation comparisons,
  unchanged detection locations, and measured orientation tradeoffs.
- Live ORB: upload/drop JPEG, PNG, WebP; new detection and description in an
  OpenCV.js worker; rotation/scale controls; real Hamming matching; output PNGs
  and measurements. This is ORB, never presented as SURF.
- All three handout questions, objectives, overview, analysis, conclusion,
  expandable Python implementation, downloadable code kit, local notes,
  mobile navigation, and configurable compilation/repository links.

## Run locally

Open this folder (lab-04) in VS Code, then in its terminal:

```powershell
npm run dev
```

Open http://127.0.0.1:4176/ in your browser. The server also exposes
http://127.0.0.1:4176/lab-04/ to check GitHub Pages repository-subpath behavior.
Node.js 22+ is sufficient; no npm install is needed to serve the site or run
the algorithm/static checks. Alternatively use VS Code Live Server. Opening
index.html directly with file:// does not support fetch and worker loading.

## Configure integration

Edit site-config.js with your real public URLs:

```js
window.LAB_CONFIG = {
  compilationUrl: 'YOUR_ACTUAL_COMPILATION_HTTPS_URL',
  repositoryUrl: 'YOUR_ACTUAL_GITHUB_REPOSITORY_HTTPS_URL',
};
```

Do not publish those example strings. Empty values deliberately open the link
settings dialog. The dialog saves settings only to the current browser; its
Download config button creates the file to deploy for all visitors. No GitHub
username, repository address, or compilation URL is invented.

## Deploy your independent GitHub Pages site

1. Create your own **public repository** for Lab 4 on GitHub Free.
2. Put the **contents of lab-04** at the repository root. index.html must be at
   the root, not nested beneath a second lab-04 folder. Include assets,
   downloads, python, scripts, tests, .nojekyll and .github/workflows/pages.yml.
   Do not upload node_modules, artifacts, test-results or the reference runtime.
3. Configure the real URLs in site-config.js and commit to main.
4. In **Settings → Pages → Build and deployment → Source**, choose
   **GitHub Actions**. The supplied workflow validates and deploys a static site.
5. Run the workflow if necessary and wait for its successful deployment URL.
6. Add that URL to the Lab 4 button on your separate compilation website.

URL format (replace both placeholders with your real values):

```text
https://YOUR-USERNAME.github.io/YOUR-LAB4-REPOSITORY/
```

You can alternatively choose **Deploy from a branch → main → /(root)**. This
buildless website works from the repository root without a bundler/base setting.
All assets use relative paths. The supplied Actions workflow publishes only
the static files and is the preferred route.

## Processing boundaries and genuine results

GitHub Pages cannot run a persistent Python/OpenCV backend. The standard bundled
OpenCV.js build exposes ORB, not SURF or SIFT. Therefore the primary SURF/SIFT/
U-SURF detectors use **genuine precomputed features**, clearly labeled in the UI.
The current browser actually recalculates L2/Hamming matching and affine
verification from those features. Changing an upload affects only live ORB;
it never produces fabricated SURF or SIFT results.

Reference extraction used OpenCV 3.4.2 from the official PyPI
opencv-contrib-python 3.4.2.17 wheel, NumPy 1.21.6, isolated Python 3.7.9, one CPU
thread. The legacy reference environment was used only to generate saved data;
it is not required by the website, not included in the deliverable, and not the
recommended environment for new projects. Modern Python code should use a
current OpenCV source build with contrib and OPENCV_ENABLE_NONFREE=ON.

scripts/generate-reference.py reproduces data under any appropriate
SURF-enabled interpreter, but counts/timings may differ with another OpenCV
version. Regenerate reference files and matching tests together if changing the
sample or engine. The source image SHA-256, runtime versions, parameters,
descriptors, native reference matches, and timing method are recorded in
assets/results/reference.json. Float32 descriptors are losslessly stored as
base64 little-endian data; ORB descriptors are uint8.

Source image: Pinterest cat photograph from the earlier conversation, not an
image supplied by the handout. See assets/NOTICE.md for attribution and licenses.

## Python and new SURF inputs

Download downloads/python-lab4.zip or open python/README.md. The kit preserves
the original OpenCV API and includes the earlier conversation scripts. New
image detection with SURF or SIFT runs locally in that Python environment.
There is no hidden remote processing dependency or API key.

To add live web SURF later, a separately hosted HTTPS API or custom nonfree
WebAssembly build is needed. A backend would accept images plus validated
Hessian/upright parameters, run cv2.xfeatures2d.SURF_create, and return genuine
keypoints/descriptors and timing provenance. It must restrict CORS to the site,
validate file dimensions/size and parameters, handle empty descriptors, and
provide appropriate resource limits. The present site makes no calls to such
an API and does not advertise live SURF uploads.

## Tests

```powershell
npm run check
npm test
npm install
npm run test:e2e
```

Browser tests use installed Google Chrome via Playwright. They exercise all
reference tasks, native-match parity, descriptor inspection, changed controls,
real live ORB, blank/invalid images, downloads, configuration, notes, mobile
layout and WCAG AA automated checks. See VALIDATION.md for actual results.

## Package

```powershell
npm run package
```

Python 3 (standard library only) is used for ZIP packaging. This regenerates
the Python kit, artifacts/github-pages, and ../CSST106-Lab04-Website.zip. Runtime
and asset licenses are retained. No build is required for production.

## Troubleshooting

- **404 after deployment:** verify index.html is at repo root, Pages is enabled,
  and the URL includes your repository path and trailing slash.
- **Empty experiments under file://:** run the HTTP preview server instead.
- **Reference loading failure:** click Retry reference loading; verify the
  assets/results/reference.json path. The saved gallery remains usable.
- **ORB first run is slow:** the bundled runtime is about 11 MB. Wait or cancel
  and retry. It is loaded only when you run live ORB; no CDN is required.
- **No features on a blank image:** a valid outcome, not an inference failure.
- **SURF unavailable in Python:** ordinary modern contrib wheels disable it.
  Follow python/README.md; do not silently substitute ORB as SURF.
- **Changing controls leaves an old result:** click that module's run button;
  the status explicitly marks changed settings. Export records retain the
  settings of the latest completed run.
- **Image upload rejected:** use JPEG/PNG/WebP below 15 MiB and 40 megapixels,
  at least 32 pixels on both axes. Processing is capped at 640 px per side.

## Sources

- Primary authority: CSST106_Lab_Experiment_04_SURF_Feature_Detection.docx.
  Its exact coverage is mapped in SOURCE_MAP.md; logos are not republished.
- https://docs.opencv.org/4.x/df/dd2/tutorial_py_surf_intro.html
- https://docs.opencv.org/4.x/dc/dc3/tutorial_py_matcher.html
- https://docs.opencv.org/4.x/d1/d89/tutorial_py_orb.html
- https://github.com/opencv/opencv-python/blob/4.x/README.md
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Handout tutorial: https://pysource.com/2018/03/21/feature-detection-sift-surf-obr-opencv-3-4-with-python-3-tutorial-25/
- Handout video: https://www.youtube.com/watch?v=PBTrwymDVCg
