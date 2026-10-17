"""Generate all saved results using a real SURF-enabled OpenCV interpreter.
Run with that interpreter, not necessarily your default Python.
"""
import hashlib
import base64
import importlib.util
import json
import platform
import sys
from pathlib import Path
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lab", ROOT / "python" / "surf_lab.py")
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)
cv2.setNumThreads(1)
source = lab.load_gray(ROOT / "assets" / "cat.jpg")
out = ROOT / "assets" / "results"
out.mkdir(exist_ok=True)
cv2.imwrite(str(out / "source.png"), source)


def encoded(points, descriptors, duration):
    return {"keypoints": [{"x": p.pt[0], "y": p.pt[1], "size": p.size,
                           "angle": p.angle, "response": p.response} for p in points],
            "descriptorData": "" if descriptors is None else base64.b64encode(descriptors.astype(np.uint8 if descriptors.dtype == np.uint8 else '<f4').tobytes()).decode('ascii'),
            "descriptorRows": len(points),
            "descriptorType": "uint8" if descriptors is not None and descriptors.dtype == np.uint8 else "float32-le",
            "descriptorColumns": 0 if descriptors is None else descriptors.shape[1],
            "extractMs": duration}


reference = {
    "laboratory": "CSST106 Lab 4 - SURF Feature Detection",
    "engine": "OpenCV " + cv2.__version__, "python": platform.python_version(),
    "sampleSha256": hashlib.sha256((ROOT / "assets" / "cat.jpg").read_bytes()).hexdigest(),
    "width": source.shape[1], "height": source.shape[0],
    "provenance": "Genuine precomputed OpenCV detection and descriptors. Not live detection.",
    "benchmark": "One CPU thread; one warmup then five extractions per image; median per image. Pair time is the sum of those medians; excludes matching, decoding and drawing.",
    "parameters": {"thresholds": [100, 400, 1000, 2000], "angles": [0, 15, 45, 90],
                   "scale": 0.85, "translation": [15, 10], "ratio": 0.75,
                   "surfExtended": False, "orbNFeatures": 1000, "siftNFeatures": 1000},
    "sources": {}, "targets": {}, "matches": {}, "thresholdCounts": []}
cache = {}
for name in ("SURF", "SIFT", "ORB", "U-SURF"):
    thresholds = (100, 400, 1000, 2000) if name == "SURF" else (400,)
    for threshold in thresholds:
        key = name + "-" + str(threshold)
        kp, des, duration = lab.extract(name, source, threshold)
        cache[key] = (kp, des)
        reference["sources"][key] = encoded(kp, des, duration)
        if name == "SURF":
            reference["thresholdCounts"].append({"threshold": threshold, "keypoints": len(kp)})
        if threshold == 400:
            drawing = cv2.drawKeypoints(source, kp, None, (0, 107, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
            cv2.imwrite(str(out / (name.lower() + "-keypoints.webp")), drawing, [cv2.IMWRITE_WEBP_QUALITY, 90])
        print("Source", key, len(kp), flush=True)
for angle in (0, 15, 45, 90):
    target, matrix = lab.transform(source, angle)
    cv2.imwrite(str(out / ("target-" + str(angle) + ".png")), target)
    reference["targets"][str(angle)] = {"matrix": matrix.tolist(), "features": {}}
    for key in reference["sources"]:
        name, threshold = key.rsplit("-", 1)
        kp2, des2, duration = lab.extract(name, target, int(threshold))
        reference["targets"][str(angle)]["features"][key] = encoded(kp2, des2, duration)
        kp1, des1 = cache[key]
        matches = lab.match(des1, des2, name)
        reference["matches"][key + "@" + str(angle)] = {
            "pairs": [[m.queryIdx, m.trainIdx, float(m.distance)] for m in matches],
            "verified": int(lab.geometric_count(kp1, kp2, matches, matrix))}
        if int(threshold) == 400 and angle == 15:
            picture = cv2.drawMatches(source, kp1, target, kp2, matches[:35], None,
                                      flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
            cv2.imwrite(str(out / (name.lower() + "-matches.webp")), picture, [cv2.IMWRITE_WEBP_QUALITY, 90])
        print("Target", angle, key, len(kp2), len(matches), flush=True)
(out / "reference.json").write_text(json.dumps(reference, separators=(",", ":")), encoding="utf-8")
print("Saved", out / "reference.json", flush=True)
