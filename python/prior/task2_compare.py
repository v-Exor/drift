import csv
from lab_common import cv2, OUT, load_images, make_surf, evaluate, save_matches

img1, img2 = load_images()
algorithms = [
    ("SURF", make_surf(), cv2.NORM_L2),
    ("SIFT", cv2.SIFT_create(), cv2.NORM_L2),
    ("ORB", cv2.ORB_create(nfeatures=2000), cv2.NORM_HAMMING),
]
rows = []
for name, detector, norm in algorithms:
    result = evaluate(detector, img1, img2, norm)
    kp1, _, kp2, _, good, milliseconds = result
    rows.append([name, len(kp1), len(kp2), len(good), round(milliseconds, 2)])
    save_matches(f"compare_{name}", img1, img2, result)

header = ["Algorithm", "Keypoints1", "Keypoints2", "RatioMatches", "ExtractPair_ms"]
print(" | ".join(header))
for row in rows:
    print(" | ".join(map(str, row)))
with (OUT / "comparison.csv").open("w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(header)
    writer.writerows(rows)
print("Images and comparison.csv saved in:", OUT)
