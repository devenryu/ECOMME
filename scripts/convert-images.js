const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertSvgToPng(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath, 'utf8');
  const base64Data = data.replace(/^data:image\/svg\+xml;base64,/, '');
  const svgBuffer = Buffer.from(base64Data, 'base64');
  
  await sharp(svgBuffer)
    .resize(800, 600)
    .png()
    .toFile(outputPath);
}

async function main() {
  const templates = ['minimal', 'standard', 'premium'];
  const publicDir = path.join(process.cwd(), 'public', 'templates');
  
  for (const template of templates) {
    const inputPath = path.join(publicDir, `${template}.png`);
    const tempPath = path.join(publicDir, `${template}_temp.png`);
    const outputPath = path.join(publicDir, `${template}.png`);
    
    try {
      await convertSvgToPng(inputPath, tempPath);
      // Replace the original file with the converted one
      fs.renameSync(tempPath, outputPath);
      console.log(`Converted ${template}.png`);
    } catch (error) {
      console.error(`Error converting ${template}.png:`, error);
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
}

main().catch(console.error); 