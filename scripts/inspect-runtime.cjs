const cv = require('../assets/vendor/opencv.js');
cv.then(module => {
  try {
    console.log(JSON.stringify({ orb: !!module.ORB, sift: !!module.SIFT, surf: !!module.SURF }));
    const orb = new module.ORB(1000); console.log('ORB instantiated'); orb.delete();
  } catch (error) { console.log(String(error)); process.exitCode = 1; }
});
