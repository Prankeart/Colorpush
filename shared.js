// shared.js — Verici ve Alıcı arasında paylaşılan protokol
// ================================================================

const GRID_SIZE = 8;
const CELLS = GRID_SIZE * GRID_SIZE;
const BITS_PER_CELL = 2;
const BYTES_PER_FRAME = 16;
const HEADER_SIZE = 6;
const DATA_PER_FRAME = 8;
const CHECKSUM_OFFSET = 14;

// ⚠️ SİYAH YOK! Arka planla karışmasın diye MAVİ kullanıyoruz.
// Renkler RGB uzayında birbirinden maksimum uzakta seçildi.
const PALETTE = [
  { name: 'mavi',    r: 30,  g: 100, b: 255 },  // 00
  { name: 'kirmizi', r: 255, g: 40,  b: 40  },  // 01
  { name: 'yesil',   r: 40,  g: 220, b: 60  },  // 10
  { name: 'beyaz',   r: 255, g: 255, b: 255 },  // 11
];

function crc16(bytes, len) {
  let crc = 0xFFFF;
  for (let i = 0; i < len; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc;
}

function encodeFrames(data) {
  const totalLen = data.length;
  const numFrames = Math.max(1, Math.ceil(totalLen / DATA_PER_FRAME));
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const frame = new Uint8Array(BYTES_PER_FRAME);
    frame[0] = (i >> 8) & 0xFF;
    frame[1] = i & 0xFF;
    frame[2] = (numFrames >> 8) & 0xFF;
    frame[3] = numFrames & 0xFF;
    frame[4] = (totalLen >> 8) & 0xFF;
    frame[5] = totalLen & 0xFF;

    for (let j = 0; j < DATA_PER_FRAME; j++) {
      const idx = i * DATA_PER_FRAME + j;
      frame[HEADER_SIZE + j] = idx < totalLen ? data[idx] : 0;
    }

    const cs = crc16(frame, CHECKSUM_OFFSET);
    frame[CHECKSUM_OFFSET]     = (cs >> 8) & 0xFF;
    frame[CHECKSUM_OFFSET + 1] = cs & 0xFF;
    frames.push(frame);
  }

  return { frames, numFrames, totalLen };
}

function validateFrame(frame) {
  const cs = (frame[CHECKSUM_OFFSET] << 8) | frame[CHECKSUM_OFFSET + 1];
  if (cs !== crc16(frame, CHECKSUM_OFFSET)) return false;
  for (let i = 0; i < CHECKSUM_OFFSET; i++) if (frame[i] !== 0) return true;
  return false;
}

function frameToCells(frame) {
  const cells = new Uint8Array(CELLS);
  for (let i = 0; i < BYTES_PER_FRAME; i++) {
    const b = frame[i];
    cells[i*4]     = (b >> 6) & 3;
    cells[i*4 + 1] = (b >> 4) & 3;
    cells[i*4 + 2] = (b >> 2) & 3;
    cells[i*4 + 3] =  b       & 3;
  }
  return cells;
}

function cellsToFrame(cells) {
  const frame = new Uint8Array(BYTES_PER_FRAME);
  for (let i = 0; i < BYTES_PER_FRAME; i++) {
    frame[i] = ((cells[i*4]     & 3) << 6) |
               ((cells[i*4 + 1] & 3) << 4) |
               ((cells[i*4 + 2] & 3) << 2) |
               ( cells[i*4 + 3] & 3);
  }
  return frame;
}

function classifyColor(r, g, b) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const p = PALETTE[i];
    const dr = r - p.r, dg = g - p.g, db = b - p.b;
    const d = dr*dr + dg*dg + db*db;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function parseFrameHeader(frame) {
  return {
    index:  (frame[0] << 8) | frame[1],
    total:  (frame[2] << 8) | frame[3],
    length: (frame[4] << 8) | frame[5],
  };
}

function assembleData(receivedMap, totalFrames, dataLength) {
  const buffer = new Uint8Array(totalFrames * DATA_PER_FRAME);
  for (let i = 0; i < totalFrames; i++) {
    const frame = receivedMap.get(i);
    if (!frame) return null;
    for (let j = 0; j < DATA_PER_FRAME; j++) {
      buffer[i * DATA_PER_FRAME + j] = frame[HEADER_SIZE + j];
    }
  }
  return buffer.slice(0, dataLength);
}
