# Laboratory 4 publication and compilation integration

Repository: https://github.com/v-Exor/drift

Website address (available after the first successful Pages deployment):
https://v-exor.github.io/drift/

Publishing source: GitHub Actions. The included .github/workflows/pages.yml
checks all static assets and genuine OpenCV feature fixtures before deployment.
Push future updates to main to publish them.

## Connect Website_LaboratoryAct_Compilation

Set its Laboratory Activity 4 button/link destination to:

```text
https://v-exor.github.io/drift/
```

For a plain HTML compilation page:

```html
<a href="https://v-exor.github.io/drift/"
   target="_blank" rel="noopener noreferrer">
  Open Laboratory Activity 4
</a>
```

Once the compilation website's actual public URL is known, set compilationUrl
in site-config.js to it and push the change. The repository URL is configured.
Until then, Back to Laboratory Compilation opens the working configuration
dialog. No compilation address is invented. No compilation repository has
been created or modified as part of this Lab 4 publication.

All source, assets, bundled OpenCV runtime/licenses, genuine reference results,
Python implementations, image sample, downloadable kit, tests, documentation,
and deployment configuration are included. Local dependencies and QA artifacts
are excluded from Git. SURF/SIFT/U-SURF detections remain clearly labeled as
genuine saved data; the separate uploaded-image playground runs real ORB.
