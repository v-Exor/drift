"""CSST106 Lab 4: genuine OpenCV SURF, SIFT, ORB and upright SURF.

Requires an OpenCV build with contrib and OPENCV_ENABLE_NONFREE=ON.
Run: python surf_lab.py --image cat.jpg --output results --no-show
"""
import argparse
import csv
import json
from pathlib import Path
from statistics import median
from time import perf_counter

import cv2
import numpy as np


def detector(name, threshold=400, max_features=1000):
    if name in ("SURF", "U-SURF"):
        try:
            return cv2.xfeatures2d.SURF_create(
                hessianThreshold=float(threshold), extended=False,
                upright=(name == "U-SURF"))
        except (AttributeError, cv2.error) as error:
            raise RuntimeError(
                "SURF is unavailable. Use a contrib/nonfree OpenCV build. "
                "Installing the ordinary PyPI contrib wheel is insufficient."
            ) from error
    if name == "SIFT":
        create = getattr(cv2, "SIFT_create", None)
        if create is None:
            create = cv2.xfeatures2d.SIFT_create
        return create(nfeatures=max_features)
    if name == "ORB":
        return cv2.ORB_create(nfeatures=max_features)
    raise ValueError("Unknown detector: " + name)


def load_gray(path):
    image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError("Cannot read image: " + str(path))
    scale = min(1.0, 640.0 / max(image.shape))
    if scale < 1:
        image = cv2.resize(image, None, fx=scale, fy=scale,
                           interpolation=cv2.INTER_AREA)
    return image


def transform(image, angle=15, scale=0.85):
    height, width = image.shape
    matrix = cv2.getRotationMatrix2D((width / 2.0, height / 2.0), angle, scale)
    matrix[:, 2] += (15, 10)
    target = cv2.warpAffine(image, matrix, (width, height),
                            flags=cv2.INTER_LINEAR, borderValue=255)
    return target, matrix


def extract(name, image, threshold=400, repeats=5):
    algorithm = detector(name, threshold)
    algorithm.detectAndCompute(image, None)  # Warm up; excluded from timing.
    durations = []
    for _ in range(repeats):
        start = perf_counter()
        points, descriptors = algorithm.detectAndCompute(image, None)
        durations.append((perf_counter() - start) * 1000)
    return points, descriptors, median(durations)


def match(des1, des2, name, ratio=0.75):
    if des1 is None or des2 is None or len(des2) < 2:
        return []
    norm = cv2.NORM_HAMMING if name == "ORB" else cv2.NORM_L2
    pairs = cv2.BFMatcher(norm).knnMatch(des1, des2, k=2)
    return sorted([p[0] for p in pairs if len(p) == 2
                   and p[0].distance < ratio * p[1].distance],
                  key=lambda m: m.distance)


def geometric_count(points1, points2, matches, matrix, tolerance=3.0):
    return int(sum(np.linalg.norm(matrix.dot(
        [points1[m.queryIdx].pt[0], points1[m.queryIdx].pt[1], 1.0])
        - np.array(points2[m.trainIdx].pt)) <= tolerance for m in matches))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, default=Path(__file__).parent / "cat.jpg")
    parser.add_argument("--image2", type=Path)
    parser.add_argument("--output", type=Path, default=Path("results"))
    parser.add_argument("--threshold", type=float, default=400)
    parser.add_argument("--angle", type=float, default=15)
    parser.add_argument("--no-show", action="store_true")
    args = parser.parse_args()
    if args.threshold <= 0 or not -180 <= args.angle <= 180:
        parser.error("Use a positive threshold and an angle between -180 and 180.")
    cv2.setNumThreads(1)
    source = load_gray(args.image)
    target, matrix = transform(source, args.angle)
    if args.image2:
        target, matrix = load_gray(args.image2), None
    args.output.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(args.output / "input1.png"), source)
    cv2.imwrite(str(args.output / "input2.png"), target)
    rows, records = [], {}
    for name in ("SURF", "SIFT", "ORB", "U-SURF"):
        kp1, des1, t1 = extract(name, source, args.threshold)
        kp2, des2, t2 = extract(name, target, args.threshold)
        matches = match(des1, des2, name)
        verified = geometric_count(kp1, kp2, matches, matrix) if matrix is not None else None
        picture = cv2.drawMatches(source, kp1, target, kp2, matches[:50], None,
                                 flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
        keypoints = cv2.drawKeypoints(source, kp1, None, (0, 107, 255),
                                     cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        cv2.imwrite(str(args.output / (name + "_matches.png")), picture)
        cv2.imwrite(str(args.output / (name + "_keypoints.png")), keypoints)
        record = {"keypoints1": len(kp1), "keypoints2": len(kp2),
                  "descriptorShape": None if des1 is None else list(des1.shape),
                  "matches": len(matches), "verifiedWithin3px": verified,
                  "extractPairMs": round(t1 + t2, 3)}
        records[name] = record
        rows.append([name, len(kp1), len(kp2), len(matches), verified, t1 + t2])
        print(name, record)
        if not args.no_show:
            cv2.namedWindow(name, cv2.WINDOW_NORMAL)
            cv2.imshow(name, picture)
    print("\nHessian threshold experiment, same source image:")
    records["thresholds"] = []
    for threshold in (100, 400, 1000, 2000):
        points, _, _ = extract("SURF", source, threshold)
        records["thresholds"].append({"threshold": threshold, "keypoints": len(points)})
        print(threshold, len(points))
    with (args.output / "comparison.csv").open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Algorithm", "Keypoints1", "Keypoints2", "RatioMatches",
                         "Verified3px", "ExtractPair_ms"])
        writer.writerows(rows)
    (args.output / "results.json").write_text(json.dumps(records, indent=2))
    if not args.no_show:
        print("Click an image window and press any key to close.")
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
