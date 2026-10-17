# Lab 4 Python implementation

Use a current Python 3 environment with NumPy and a SURF-enabled OpenCV contrib
build. Standard current PyPI opencv-contrib-python wheels do not enable SURF.
SIFT is available in modern standard OpenCV; the older handout note is outdated.

## Windows source-build option

Install Python 3.11 and Microsoft Visual C++ Build Tools with the Desktop
development with C++ workload first. In PowerShell, inside the Python kit:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
$env:CMAKE_ARGS = '-DOPENCV_ENABLE_NONFREE=ON'
.\.venv\Scripts\python.exe -m pip install --no-cache-dir --no-binary=opencv-contrib-python 'opencv-contrib-python<5'
.\.venv\Scripts\python.exe -c "import cv2; print(cv2.xfeatures2d.SURF_create(400))"
.\.venv\Scripts\python.exe surf_lab.py --image cat.jpg
```

Compilation can take substantial time and needs the compiler/SDK dependencies.
Use your institution's SURF-enabled interpreter instead if one is provided.
Do not install multiple conflicting OpenCV wheel variants in the same environment.

## Run

```powershell
python surf_lab.py --image cat.jpg
python surf_lab.py --image cat.jpg --angle 45 --threshold 400 --no-show
python surf_lab.py --image first.jpg --image2 second.jpg --output my-results
```

The default target is a controlled affine copy: scale 0.85, chosen rotation,
and shift (+15,+10). The program saves keypoint visualizations, matches,
comparison.csv and results.json. With unrelated input photos, geometric
verification is left unavailable because the transform is unknown.

SURF default is a 64-value descriptor; U-SURF uses upright=True. SIFT/ORB have
a 1000-feature budget; SURF uses the Hessian threshold. L2 is used for
SURF/SIFT and Hamming for ORB. Each detector warms up, then runs five times per
image. The sum of the per-image medians excludes matching and visualization.

The prior/ folder preserves the previous conversation's common module and
task scripts. It includes sample_image.jpg, and no code extracts school logos.
The top-level surf_lab.py improves reproducibility by collecting all tasks
and exposing CLI inputs. The handout's short example is in handout_example.py.

## Reference reproduction

The website generator scripts/generate-reference.py is in the full project,
not required to run this kit. The shipped reference data was produced with
OpenCV 3.4.2 and an isolated legacy interpreter solely because that wheel
contains working SURF. That interpreter is not shipped and should not replace
your current environment. Use a supported custom OpenCV build for new work.

https://github.com/opencv/opencv-python/blob/4.x/README.md
