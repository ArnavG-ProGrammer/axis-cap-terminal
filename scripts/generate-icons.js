const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = path.join(__dirname, '../public/logo_transparent.png');
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    for (const size of sizes) {
      // Create padded icon with black background
      await sharp(inputImagePath)
        .resize({
          width: Math.floor(size * 0.8), // 10% padding on each side
          height: Math.floor(size * 0.8),
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: Math.floor(size * 0.1),
          bottom: Math.floor(size * 0.1),
          left: Math.floor(size * 0.1),
          right: Math.floor(size * 0.1),
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .toFile(path.join(outputDir, `icon-${size}.png`));
      console.log(`Generated icon-${size}.png`);
    }

    // Apple Touch Icon (180x180)
    await sharp(inputImagePath)
      .resize({
        width: Math.floor(180 * 0.8),
        height: Math.floor(180 * 0.8),
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: Math.floor(180 * 0.1),
        bottom: Math.floor(180 * 0.1),
        left: Math.floor(180 * 0.1),
        right: Math.floor(180 * 0.1),
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
    console.log(`Generated apple-touch-icon.png`);

    // Favicon (32x32)
    await sharp(inputImagePath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    console.log(`Generated favicon.ico`);

  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
