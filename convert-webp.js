const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

console.log(
  "Make sure you have cwebp installed. On Windows, you can use: npm install webp-converter"
);

// Android densities
const ANDROID_DIRS = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

async function convertToWebP() {
  try {
    console.log("Converting PNG icons to WebP format...");

    for (const dir of ANDROID_DIRS) {
      const mipmapDir = path.join(
        __dirname,
        `android/app/src/main/res/mipmap-${dir}`
      );

      // Get all PNG files in the directory
      const files = fs
        .readdirSync(mipmapDir)
        .filter((file) => file.endsWith(".png"));

      for (const file of files) {
        const filePath = path.join(mipmapDir, file);
        const outputFile = filePath.replace(".png", ".webp");

        try {
          // You may need to adjust this command based on your platform and cwebp installation
          await execPromise(`cwebp ${filePath} -o ${outputFile}`);
          console.log(`Converted ${filePath} to WebP`);

          // Remove the original PNG
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error converting ${filePath}: ${err.message}`);
          console.log(
            "Alternative: Use a tool like https://convertio.co/png-webp/ to manually convert your icons"
          );
        }
      }
    }

    console.log("Icon conversion complete!");
    console.log(
      "Now rebuild your APK with: npx eas build -p android --profile apk"
    );
  } catch (error) {
    console.error("Error in conversion process:", error);
  }
}

convertToWebP();
