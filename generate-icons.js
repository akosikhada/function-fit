const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Ensure sharp is installed
console.log("Make sure you have sharp installed: npm install sharp");

const SOURCE_LOGO = path.join(__dirname, "assets/images/logo.png");

// Android icon sizes for different densities
const ANDROID_ICONS = [
  { name: "mdpi", size: 48 },
  { name: "hdpi", size: 72 },
  { name: "xhdpi", size: 96 },
  { name: "xxhdpi", size: 144 },
  { name: "xxxhdpi", size: 192 },
];

async function generateAndroidIcons() {
  try {
    console.log("Generating Android icons...");

    for (const icon of ANDROID_ICONS) {
      const targetDir = path.join(
        __dirname,
        `android/app/src/main/res/mipmap-${icon.name}`
      );
      const iconPath = path.join(targetDir, "ic_launcher.png");
      const roundIconPath = path.join(targetDir, "ic_launcher_round.png");
      const foregroundPath = path.join(targetDir, "ic_launcher_foreground.png");

      // Generate the standard launcher icon
      await sharp(SOURCE_LOGO).resize(icon.size, icon.size).toFile(iconPath);

      // Generate the round launcher icon (same as standard for simplicity)
      await sharp(SOURCE_LOGO)
        .resize(icon.size, icon.size)
        .toFile(roundIconPath);

      // Generate the foreground (slightly larger to account for padding)
      await sharp(SOURCE_LOGO)
        .resize(Math.floor(icon.size * 0.8), Math.floor(icon.size * 0.8))
        .toFile(foregroundPath);

      console.log(`Generated icons for ${icon.name}`);
    }

    console.log("All Android icons generated successfully!");
    console.log("Now run: node convert-webp.js");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

generateAndroidIcons();
