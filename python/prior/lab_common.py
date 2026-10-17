from pathlib import Path
from time import perf_counter
from statistics import median
import cv2

BASE = Path(__file__).resolve().parent
OUT = BASE / "results"
OUT.mkdir(exist_ok=True)


def load_images():
    first = BASE / "sample_image.jpg"
    if not first.exists():
        raise FileNotFoundError("Put a cat, landscape, or shapes photo named sample_image.jpg beside these scripts.")
    img1 = cv2.imread(str(first), cv2.IMREAD_GRAYSCALE)
    if img1 is None:
        raise ValueError("Cannot read sample_image.jpg")
    scale = min(1.0, 800 / max(img1.shape))
    if scale < 1:
        img1 = cv2.resize(img1, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    second = BASE / "sample_image2.jpg"
    if second.exists():
        img2 = cv2.imread(str(second), cv2.IMREAD_GRAYSCALE)
        if img2 is None:
            raise ValueError("Cannot read sample_image2.jpg")
    else:
        h, w = img1.shape
        matrix = cv2.getRotationMatrix2D((w / 2, h / 2), 0, 0.85)
        matrix[:, 2] += (15, 10)
        img2 = cv2.warpAffine(img1, matrix, (w, h), borderValue=255)
    cv2.imwrite(str(OUT / "input1.png"), img1)
    cv2.imwrite(str(OUT / "input2.png"), img2)
    return img1, img2


def make_surf(threshold=400, upright=False):
    try:
        return cv2.xfeatures2d.SURF_create(
            hessianThreshold=threshold, extended=False, upright=upright
        )
    except (AttributeError, cv2.error) as error:
        raise RuntimeError(
            "SURF unavailable: use OpenCV contrib built with OPENCV_ENABLE_NONFREE=ON."
        ) from error


def evaluate(detector, img1, img2, norm):
    detector.detectAndCompute(img1, None)  # Warm up before timing.
    detector.detectAndCompute(img2, None)
    times = []
    for _ in range(5):
        start = perf_counter()
        kp1, des1 = detector.detectAndCompute(img1, None)
        kp2, des2 = detector.detectAndCompute(img2, None)
        times.append((perf_counter() - start) * 1000)
    good = []
    if des1 is not None and des2 is not None and len(des2) >= 2:
        neighbors = cv2.BFMatcher(norm).knnMatch(des1, des2, k=2)
        good = [pair[0] for pair in neighbors
                if len(pair) == 2 and pair[0].distance < 0.75 * pair[1].distance]
    return kp1, des1, kp2, des2, good, median(times)


def save_matches(name, img1, img2, result):
    kp1, _, kp2, _, good, _ = result
    picture = cv2.drawMatches(
        img1, kp1, img2, kp2, sorted(good, key=lambda m: m.distance)[:50],
        None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
    )
    cv2.imwrite(str(OUT / f"{name}.png"), picture)
    return picture
