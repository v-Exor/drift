from lab_common import cv2, OUT, load_images, make_surf, evaluate, save_matches

img1, img2 = load_images()
h, w = img1.shape
matrix = cv2.getRotationMatrix2D((w / 2, h / 2), 45, 0.85)
rotated = cv2.warpAffine(img1, matrix, (w, h), borderValue=255)
cv2.imwrite(str(OUT / "rotated_input.png"), rotated)

for case, target in [("original_pair", img2), ("rotation_45", rotated)]:
    print(f"\n{case}")
    for name, upright in [("SURF", False), ("U_SURF", True)]:
        detector = make_surf(upright=upright)
        result = evaluate(detector, img1, target, cv2.NORM_L2)
        kp1, _, kp2, _, good, milliseconds = result
        print(f"{name}: {len(kp1)}/{len(kp2)} keypoints, "
              f"{len(good)} ratio-test matches, {milliseconds:.2f} ms")
        save_matches(f"{case}_{name}", img1, target, result)
print("Result images saved in:", OUT)
