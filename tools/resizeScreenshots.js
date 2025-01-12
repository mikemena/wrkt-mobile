// resizeScreenshots.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TARGET_DIMS = {
  portrait: { width: 1290, height: 2796 }
};

async function resizeImage(inputPath) {
  const filename = path.basename(inputPath);
  const outputPath = path.join(path.dirname(inputPath), `resized_${filename}`);

  try {
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();

    // Calculate if image should be portrait based on aspect ratio
    const originalAspect = metadata.width / metadata.height;
    const targetAspect =
      TARGET_DIMS.portrait.width / TARGET_DIMS.portrait.height;

    await sharp(inputPath)
      .resize({
        width: TARGET_DIMS.portrait.width,
        height: TARGET_DIMS.portrait.height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(outputPath);

    console.log(
      `✅ Resized ${filename} to ${TARGET_DIMS.portrait.width}x${TARGET_DIMS.portrait.height}`
    );
    return outputPath;
  } catch (error) {
    console.error(`❌ Error resizing ${filename}:`, error);
    return null;
  }
}

async function resizeDirectory(dirPath) {
  const files = fs
    .readdirSync(dirPath)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .map(file => path.join(dirPath, file));

  console.log(`Found ${files.length} images to resize.`);

  for (const file of files) {
    await resizeImage(file);
  }
}

// If running directly (not imported)
if (require.main === module) {
  const screenshotsDir = process.argv[2] || './screenshots';

  if (!fs.existsSync(screenshotsDir)) {
    console.error(`Directory ${screenshotsDir} does not exist!`);
    process.exit(1);
  }

  resizeDirectory(screenshotsDir).catch(console.error);
}

module.exports = { resizeImage, resizeDirectory };
