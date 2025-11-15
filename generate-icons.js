const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'src/public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created icons directory');
}

// Create SVG template
const sizes = [48, 72, 96, 144, 192, 512];

const createSVG = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  
  <!-- Icon content -->
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <!-- Book -->
    <rect x="0" y="${size * 0.1}" width="${size * 0.5}" height="${size * 0.4}" fill="white" rx="${size * 0.02}"/>
    <line x1="${size * 0.25}" y1="${size * 0.1}" x2="${size * 0.25}" y2="${size * 0.5}" stroke="#2563eb" stroke-width="${size * 0.02}"/>
    
    <!-- Location pin -->
    <circle cx="${size * 0.4}" cy="${size * 0.15}" r="${size * 0.08}" fill="#f59e0b"/>
    <circle cx="${size * 0.4}" cy="${size * 0.15}" r="${size * 0.04}" fill="white"/>
  </g>
  
  <!-- Text (for larger sizes) -->
  ${size >= 192 ? `<text x="${size / 2}" y="${size * 0.85}" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" text-anchor="middle" fill="white">Story</text>` : ''}
</svg>`;
};

// Generate icons
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Generated ${filename}`);
});

console.log('\n📝 SVG icons generated!');
console.log('\nNext steps:');
console.log('1. Convert SVG to PNG using online tool:');
console.log('   - https://svgtopng.com/');
console.log('   - https://www.adobe.com/express/feature/image/convert/svg-to-png');
console.log('2. Or install sharp: npm install sharp');
console.log('3. Or use the SVG files directly (some browsers support it)');
console.log('\nFor quick testing, SVG files will work on most browsers.');

// Create a note file
const noteContent = `
PWA ICONS GENERATED
===================

SVG icons have been created in: ${iconsDir}

IMPORTANT:
For best PWA support, convert these SVG files to PNG.

Quick convert online:
1. Visit: https://svgtopng.com/
2. Upload each SVG file
3. Download PNG
4. Replace SVG with PNG in the icons folder

Or use sharp (recommended):
npm install sharp
Then use the sharp script to convert all at once.

For testing purposes, SVG files will work in most modern browsers.
`;

fs.writeFileSync(path.join(iconsDir, 'README.txt'), noteContent);
console.log('\n📄 Created README.txt in icons folder');
console.log('\n🎉 Done! Check src/public/icons/ folder');