from lab_common import cv2, OUT, load_images, make_surf, evaluate, save_matches

img1, img2 = load_images()
surf = make_surf()
result = evaluate(surf, img1, img2, cv2.NORM_L2)
kp1, des1, kp2, des2, good, milliseconds = result
print("Image 1 keypoints:", len(kp1))
print("Image 2 keypoints:", len(kp2))
print("Image 1 descriptor shape:", None if des1 is None else des1.shape)
print("Ratio-test matches:", len(good))
print(f"Detection + description for both images: {milliseconds:.2f} ms")

keypoint_image = cv2.drawKeypoints(
    img1, kp1, None, (255, 0, 0),
    cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
)
cv2.imwrite(str(OUT / "SURF_keypoints.png"), keypoint_image)
matches = save_matches("SURF_matches", img1, img2, result)

print("\nHessian threshold experiment:")
for threshold in (100, 400, 1000, 2000):
    points, _ = make_surf(threshold).detectAndCompute(img1, None)
    print(f"Threshold {threshold}: {len(points)} keypoints")

cv2.namedWindow("SURF keypoints", cv2.WINDOW_NORMAL)
cv2.imshow("SURF keypoints", keypoint_image)
cv2.namedWindow("SURF matches", cv2.WINDOW_NORMAL)
cv2.imshow("SURF matches", matches)
cv2.waitKey(0)
cv2.destroyAllWindows()
