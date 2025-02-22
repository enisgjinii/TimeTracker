#!/usr/bin/env node
const FileIconExtractor = require('file-icon-extractor');

if (process.argv.length < 4) {
  console.error("Usage: node extract-icon.js <appPath> <iconPath> [size]");
  process.exit(1);
}

const appPath = process.argv[2];
const iconPath = process.argv[3];
const size = process.argv[4] ? parseInt(process.argv[4], 10) : 64;

try {
  // Synchronously extract the icon to the specified path.
  FileIconExtractor.extract(appPath, iconPath, size);
  process.exit(0);
} catch (err) {
  console.error("Error extracting icon:", err);
  process.exit(1);
}
