/**
 * Generate real PNG PWA icons without external dependencies.
 *
 * The previous placeholder files were either SVG content saved with a .png
 * extension or 1x1 PNGs reused for every manifest size. Browsers reject those
 * because the actual bitmap dimensions do not match the manifest.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const iconsDir = path.join(process.cwd(), "public", "icons");
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }

  return table;
}

const crcTable = makeCrcTable();

function crc32(buffers) {
  let crc = 0xffffffff;

  for (const buffer of buffers) {
    for (let i = 0; i < buffer.length; i += 1) {
      crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32([typeBuffer, data]), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function rgba(width, height, paint) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0;

    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = paint(x, y, width, height);
      const offset = rowStart + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  return raw;
}

function insideRoundRect(x, y, left, top, right, bottom, radius) {
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function createIcon(size) {
  const margin = size * 0.15;
  const bagLeft = size * 0.25;
  const bagTop = size * 0.34;
  const bagRight = size * 0.75;
  const bagBottom = size * 0.78;
  const handleTop = size * 0.22;
  const handleBottom = size * 0.42;
  const stroke = Math.max(3, size * 0.045);
  const radius = size * 0.06;

  const image = rgba(size, size, (x, y, width, height) => {
    const t = (x + y) / (width + height);
    let r = Math.round(244 - t * 32);
    let g = Math.round(198 - t * 40);
    let b = Math.round(62 - t * 22);
    let a = 255;

    const safeMask = insideRoundRect(x, y, margin * 0.35, margin * 0.35, size - margin * 0.35, size - margin * 0.35, size * 0.18);
    if (!safeMask) {
      r = 255;
      g = 255;
      b = 255;
    }

    const bag = insideRoundRect(x, y, bagLeft, bagTop, bagRight, bagBottom, radius);
    if (bag) {
      r = 26;
      g = 35;
      b = 50;
    }

    const inner = insideRoundRect(x, y, bagLeft + stroke, bagTop + stroke, bagRight - stroke, bagBottom - stroke, radius * 0.65);
    if (inner) {
      r = 255;
      g = 255;
      b = 255;
    }

    const handleOuter =
      x >= size * 0.36 &&
      x <= size * 0.64 &&
      y >= handleTop &&
      y <= handleBottom &&
      ((x - size * 0.5) / (size * 0.14)) ** 2 + ((y - handleBottom) / (size * 0.2)) ** 2 <= 1;
    const handleInner =
      x >= size * 0.41 &&
      x <= size * 0.59 &&
      y >= handleTop + stroke &&
      y <= handleBottom &&
      ((x - size * 0.5) / (size * 0.09)) ** 2 + ((y - handleBottom) / (size * 0.145)) ** 2 <= 1;

    if (handleOuter && !handleInner && y < bagTop + stroke) {
      r = 26;
      g = 35;
      b = 50;
    }

    const leftBar = x >= size * 0.39 && x <= size * 0.45 && y >= size * 0.5 && y <= size * 0.66;
    const rightBar = x >= size * 0.55 && x <= size * 0.61 && y >= size * 0.5 && y <= size * 0.66;
    const centerV = x >= size * 0.48 && x <= size * 0.52 && y >= size * 0.52 && y <= size * 0.66;
    const centerTop = x >= size * 0.45 && x <= size * 0.55 && y >= size * 0.5 && y <= size * 0.56;

    if (inner && (leftBar || rightBar || centerV || centerTop)) {
      r = 26;
      g = 35;
      b = 50;
    }

    return [r, g, b, a];
  });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(image, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), createIcon(size));
  console.log(`Created ${filename}`);
}

console.log("PWA icons generated with correct PNG dimensions.");
