# Laboratory 4 source coverage

Primary source: CSST106_Lab_Experiment_04_SURF_Feature_Detection.docx, inspected
in full through its document text, including tables and all three questions.
No other laboratory's algorithms or requirements have been substituted.

| Handout requirement | Website / implementation |
| --- | --- |
| Objective: understand SURF theory, keypoints, descriptors, visualization | Overview, objectives, Task 1, descriptor inspector |
| Step 1: cv2/NumPy import; load grayscale; handle missing image | Python handout_example.py and surf_lab.py; source/target panels |
| Step 2: SURF_create with Hessian 400; detectAndCompute; report count | Genuine saved SURF-400; Task 1 metrics; Python detector/extract |
| Step 3: rich keypoint drawing, size and orientation | Task 1 keypoint canvas; genuine saved hero; Python drawKeypoints |
| Activity 1: feature matching between two images with SURF descriptors | Task 1 real L2 ratio matching over genuine OpenCV SURF descriptors |
| Activity 2: compare SURF with ORB/SIFT on same images | Task 2 and same-runtime data; three rows and visualizations; Python CSV |
| Activity 3: explore U-SURF | Task 3 normal/upright results for four rotations; same location check |
| Hessian threshold question | Four independently extracted feature sets; real count chart |
| Descriptor purpose question | Question 2, local feature explanation, 64-value inspector |
| SURF/SIFT/ORB comparison question | Question 3, Task 2 settings and timing caveats |
| ORB alternative when SURF unavailable | Explicit live ORB browser extension; never relabeled SURF |
| A4 handwritten questions | All three included and downloadable as ANSWERS.md |
| Materials: Python 3 and contrib | Python kit, compiler/nonfree instructions, source-build caveat |

## Corrections and additions

- The Word file is the task authority, not a current OpenCV installation guide.
  Modern contrib wheels do not enable SURF; SIFT is in modern standard OpenCV.
- The original handout does not specify any sample photograph or numerical
  expected counts. The cat was selected in this conversation at the user's
  request. School logos embedded in the document are not experimental samples.
- The controlled scale/rotation/translation, ratio test, 3-pixel geometric
  verification, downloadable results, notes, upload handling, and responsive
  website are reproducibility/interaction additions, not invented handout tasks.
- Genuine reference features are clearly labeled precomputed detection. The
  browser calculates descriptor matches/geometry; it does not run SURF/SIFT
  detection on arbitrary uploads. Live ORB is separately labeled.
- Saved native timings and live browser timings describe different execution
  environments. No claim is made that a single cat pair ranks algorithms.

Handout references are preserved in README.md. Modern technical corrections
are grounded in the official OpenCV documentation linked there.
