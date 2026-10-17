# CSST106 Laboratory 4 written answers

1. **What effect does changing the Hessian threshold have on the number of detected keypoints?**
Increasing it retains stronger Hessian responses and generally produces fewer
keypoints. Decreasing it accepts weaker responses and generally produces more,
potentially including noise. The handout uses 400. On this cat sample, 100,
400, 1000, and 2000 produced 547, 141, 49, and 21 source keypoints.

2. **What are the descriptors in SURF used for, and why are they important?**
They are numerical vectors describing local appearance around keypoints.
Comparing them identifies corresponding features across images despite scale
changes and, with standard SURF, rotation. They support object recognition,
tracking, and image stitching. Default descriptors contain 64 floats; extended
mode contains 128.

3. **How does SURF compare to SIFT and ORB in feature detection and speed?**
SURF detects Hessian-based blob-like features with efficient box filters and
integral images. SIFT uses scale-space extrema and gradient-histogram
descriptors. ORB uses FAST corners and oriented BRIEF binary descriptors.
SURF was designed to be faster than SIFT; ORB is generally fast and compact.
Actual speed and matching quality depend on images, parameters, hardware,
and implementation. Report the actual measured results and settings.

The handout requests these responses handwritten on A4 paper.
