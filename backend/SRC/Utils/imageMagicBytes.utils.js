import fs from 'fs';
import path from 'path';

function readHeader(filePath, length = 12) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(length);
  fs.readSync(fd, buffer, 0, length, 0);
  fs.closeSync(fd);
  return buffer;
}

function bytesMatch(buf, signature, offset = 0) {
  return signature.every((byte, i) => buf[offset + i] === byte);
}

function isHeicOrHeif(buf) {
  if (buf.length < 12) return false;
  const ftyp = buf.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') return false;
  const brand = buf.toString('ascii', 8, 12).toLowerCase();
  return brand.startsWith('heic') || brand.startsWith('heif') || brand.startsWith('mif1');
}

/**
 * Validates image content via magic bytes (not MIME/extension alone).
 */
export function isValidImageFile(filePath) {
  try {
    const buf = readHeader(filePath, 12);
    if (bytesMatch(buf, [0xff, 0xd8, 0xff])) return true; // JPEG
    if (bytesMatch(buf, [0x89, 0x50, 0x4e, 0x47])) return true; // PNG
    if (bytesMatch(buf, [0x47, 0x49, 0x46])) return true; // GIF
    if (bytesMatch(buf, [0x52, 0x49, 0x46, 0x46]) && buf.length >= 12 && bytesMatch(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
      return true; // WEBP (RIFF....WEBP)
    }
    if (isHeicOrHeif(buf)) return true;
    return false;
  } catch {
    return false;
  }
}

export function collectUploadedFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    for (const value of Object.values(req.files)) {
      if (Array.isArray(value)) files.push(...value);
    }
  }
  return files;
}

export function uploadedFilePath(file) {
  if (file.path) return file.path;
  if (file.destination && file.filename) {
    return path.join(file.destination, file.filename);
  }
  return null;
}
