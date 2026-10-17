# Validation record

Verified on 2026-10-16 for CSST106 Laboratory 4 only.

## Source and content

The Word document was reopened and its full text checked. Its objective,
three introductory steps, three required activities, and all three questions
are present. SOURCE_MAP.md records the correspondence. School logos are not
used as experimental assets. The sample is the Pinterest cat from the earlier
conversation.

## Algorithm tests

`npm test`: **5 tests passed**.

- Browser L2/Hamming matching reproduces native OpenCV's accepted match indices
  and 3-pixel geometric counts for **all 28 saved cases**.
- Actual SURF source counts at thresholds 100/400/1000/2000:
  **547 / 141 / 49 / 21**.
- Standard SURF and U-SURF share detection positions/scale, while descriptors
  differ, for source and every saved rotation.
- Ratio strictness, empty/one-descriptor inputs, ambiguous zero-distance ties,
  malformed feature shapes, invalid binary values and bad ratios are checked.

## Browser tests

`npm run test:e2e`: **5 tests passed** in installed Google Chrome.

- Served through /lab-04/ to verify repository-subpath asset behavior.
- All tasks initialize with actual data; no page errors or missing requests.
- Threshold changes, point inspector, 16 descriptor cells, rotation controls,
  SURF/SIFT/ORB comparison and U-SURF comparison exercised.
- CSV/PNG/config downloads checked.
- Live ORB performs new real OpenCV.js detection and matching on pixels.
- White-image ORB produces zero features/matches without crashing.
- Invalid text upload is rejected and the previous valid input retained.
- Uploaded input does not change the saved SURF experiment results.
- Configurable links and local notes survive a reload.
- Desktop and mobile axe checks report **no automated WCAG A/AA violations**
  against the selected rules. This is an automated check, not a claim of full
  accessibility certification.
- Mobile menu opens/closes. No horizontal page overflow at 320 or 390 pixels.

## Visual and tablet checks

Desktop (1440 px), mobile (390 px), and tablet (768 px) screenshots were
inspected. Hero imagery, rich keypoint output, descriptor grid, orange/white
theme, navigation, responsive stacking and whitespace were reviewed. Tablet
overflow check passed. Reduced-motion styling disables reveals/transitions.
QA screenshots are in ignored artifacts/, not required for deployment.

## Python check

The shipped surf_lab.py was executed end to end with a real SURF-enabled
OpenCV 3.4.2 reference interpreter, including image writes, CSV/JSON and all
four algorithms. Default pair results:

| Algorithm | Source / target points | Ratio matches | Verified within 3 px |
| --- | --- | --- | --- |
| SURF | 141 / 253 | 69 | 58 |
| SIFT | 105 / 119 | 62 | 61 |
| ORB | 176 / 243 | 116 | 97 |
| U-SURF | 141 / 253 | 35 | 26 |

Settings: grayscale 545 × 640, 15° rotation, 0.85 scale, (+15,+10) shift,
SURF Hessian 400, default 64-float SURF, feature budgets 1000, ratio 0.75.
The normal modern interpreter lacks SURF; that dependency is explicitly
documented rather than bypassed. A current nonfree source build was not
compiled during this work.

## Packaging and boundaries

Static asset, section-anchor, script syntax and URL-configuration checks passed.
The Python kit, static production directory, and independent project ZIP are
prepared by scripts/package-delivery.py. Node modules, browser test artifacts,
and the isolated legacy generator runtime are not included in the ZIP.

The website is **not deployed**; no repository was published or overwritten.
GitHub Actions deployment must run in the user's own independent repository.
SURF/SIFT/U-SURF detection is genuine precomputed reference data, not live
detection on arbitrary uploads. Matching and geometry checks run in the browser.
Live uploaded-image detection is explicitly ORB. Saved native extraction times
and live browser timings must not be compared as equivalent benchmarks.
