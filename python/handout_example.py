"""The handout's three introductory steps, with safe image loading."""
from pathlib import Path
import cv2
import numpy as np

image_path = Path(__file__).parent / 'cat.jpg'
img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
if img is None:
    raise FileNotFoundError('Error loading image: ' + str(image_path))

hessian_threshold = 400
surf = cv2.xfeatures2d.SURF_create(hessianThreshold=hessian_threshold)
keypoints, descriptors = surf.detectAndCompute(img, None)
print('Number of keypoints detected:', len(keypoints))

img_keypoints = cv2.drawKeypoints(
    img, keypoints, None, (255, 0, 0),
    cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
cv2.namedWindow('SURF Keypoints', cv2.WINDOW_NORMAL)
cv2.imshow('SURF Keypoints', img_keypoints)
cv2.waitKey(0)
cv2.destroyAllWindows()
