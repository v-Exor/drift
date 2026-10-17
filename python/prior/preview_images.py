from lab_common import cv2, load_images


def main():
    img1, img2 = load_images()
    print("Loaded sample_image.jpg: the Pinterest cat photograph.")
    print("Image 1 shape:", img1.shape)
    print("Image 2 shape:", img2.shape)
    print("Image 2 is a scaled and shifted copy unless sample_image2.jpg exists.")
    print("This preview checks image loading; it does not run SURF.")
    print("Click an image window, then press any key to close both windows.")

    for title, image in [
        ("Image 1 - Cat", img1),
        ("Image 2 - Matching input", img2),
    ]:
        cv2.namedWindow(title, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(title, 550, 650)
        cv2.imshow(title, image)

    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
