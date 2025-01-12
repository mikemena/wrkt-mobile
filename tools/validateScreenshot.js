// validateScreenshots.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Previous device specs code here...
const deviceSpecs = {
  'iPhone 6.7"': {
    devices: ['iPhone 14 Pro Max', 'iPhone 14 Plus', 'iPhone 13 Pro Max'],
    portrait: { width: 1290, height: 2796 },
    landscape: { width: 2796, height: 1290 }
  }
  // ... other specs
};

async function validateScreenshotFile(filepath) {
  try {
    const metadata = await sharp(filepath).metadata();
    const filename = path.basename(filepath);

    // Check each device spec
    const results = Object.entries(deviceSpecs).map(([device, specs]) => {
      const portraitValid =
        metadata.width === specs.portrait.width &&
        metadata.height === specs.portrait.height;
      const landscapeValid =
        metadata.width === specs.landscape.width &&
        metadata.height === specs.landscape.height;

      return {
        device,
        filename,
        isValid: portraitValid || landscapeValid,
        dimensions: `${metadata.width}x${metadata.height}`,
        format: metadata.format,
        expectedPortrait: `${specs.portrait.width}x${specs.portrait.height}`,
        expectedLandscape: `${specs.landscape.width}x${specs.landscape.height}`
      };
    });

    return results.filter(r => r.isValid);
  } catch (error) {
    console.error(`Error processing ${filepath}:`, error);
    return [];
  }
}

async function validateDirectory(dirPath) {
  const files = fs
    .readdirSync(dirPath)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .map(file => path.join(dirPath, file));

  console.log(`Found ${files.length} image files to validate.`);

  for (const file of files) {
    const results = await validateScreenshotFile(file);

    if (results.length === 0) {
      console.log(
        `❌ ${path.basename(file)} doesn't match any required dimensions`
      );
    } else {
      results.forEach(result => {
        console.log(
          `✅ ${result.filename} matches ${result.device} (${result.dimensions})`
        );
      });
    }
  }
}

// If running directly (not imported)
if (require.main === module) {
  const screenshotsDir = process.argv[2] || './screenshots';

  if (!fs.existsSync(screenshotsDir)) {
    console.error(`Directory ${screenshotsDir} does not exist!`);
    process.exit(1);
  }

  validateDirectory(screenshotsDir).catch(console.error);
}

module.exports = { validateScreenshotFile, validateDirectory };
