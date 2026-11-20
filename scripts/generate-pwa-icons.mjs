/**
 * Genera PNG de íconos PWA (192, 512, maskable) sin dependencias extra.
 * Ejecutar: node scripts/generate-pwa-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [37, 99, 235]; // #2563eb
const FG = [255, 255, 255];
const CARD_BG = [26, 29, 38]; // maskable full bleed

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const chunk = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(chunk));
  return Buffer.concat([len, chunk, crc]);
}

function createPng(size, draw) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1) + 1;
    raw[row - 1] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + x * 4;
      const [r, g, b, a] = draw(x, y, size);
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const compressed = deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function roundedRect(x, y, w, h, r, px, py, size, fill) {
  const cx = px - w / 2;
  const cy = py - h / 2;
  const inside =
    x >= cx + r &&
    x < cx + w - r &&
    y >= cy &&
    y < cy + h &&
    x >= cx &&
    x < cx + w;
  const insideVert =
    x >= cx &&
    x < cx + w &&
    y >= cy + r &&
    y < cy + h - r;
  const corners = [
    [cx + r, cy + r],
    [cx + w - r, cy + r],
    [cx + r, cy + h - r],
    [cx + w - r, cy + h - r],
  ];
  for (const [ccx, ccy] of corners) {
    const dx = x - ccx;
    const dy = y - ccy;
    if (dx * dx + dy * dy <= r * r) return fill;
  }
  if (inside || insideVert) return fill;
  return null;
}

function drawWarehouse(x, y, size, options) {
  const { background, maskable = false } = options;
  const scale = size / 512;
  const px = (v) => Math.round(v * scale);
  const py = (v) => Math.round(v * scale);
  const radius = Math.round(108 * scale);

  if (maskable) {
  } else {
    const corner = roundedRect(
      x,
      y,
      size,
      size,
      radius,
      px(256),
      py(256),
      size,
      background,
    );
    if (corner) return [...corner, 255];
    const inside = roundedRect(
      x,
      y,
      size,
      size,
      radius,
      px(256),
      py(256),
      size,
      background,
    );
    if (!inside) return [0, 0, 0, 0];
  }

  const roofY0 = py(140);
  const roofY1 = py(200);
  const roofX0 = px(96);
  const roofX1 = px(416);
  const midX = px(256);
  if (y >= roofY0 && y < roofY1) {
    const t = (y - roofY0) / (roofY1 - roofY0);
    const half = (roofX1 - roofX0) / 2;
    const left = midX - half * (1 - t);
    const right = midX + half * (1 - t);
    if (x >= left && x < right) return [...FG, 255];
  }

  const bodyX0 = px(120);
  const bodyX1 = px(392);
  const bodyY0 = py(200);
  const bodyY1 = py(360);
  if (x >= bodyX0 && x < bodyX1 && y >= bodyY0 && y < bodyY1) {
    return [...FG, 255];
  }

  const doorX0 = px(216);
  const doorX1 = px(296);
  const doorY0 = py(280);
  const doorY1 = py(360);
  if (x >= doorX0 && x < doorX1 && y >= doorY0 && y < doorY1) {
    return [...BG, 255];
  }

  return maskable ? [...background, 255] : [0, 0, 0, 0];
}

function save(name, size, options) {
  const buf = createPng(size, (x, y) => drawWarehouse(x, y, size, options));
  writeFileSync(join(outDir, name), buf);
  console.log("wrote", name);
}

save("icon-192.png", 192, { background: BG, maskable: false });
save("icon-512.png", 512, { background: BG, maskable: false });
save("icon-maskable-512.png", 512, { background: CARD_BG, maskable: true });