const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'src',
  'sweet',
  'setUpJsLogger.fx.ts'
);

if (!fs.existsSync(file)) {
  console.log('[fix-expo-jslogger] target file not found, skipping');
  process.exit(0);
}

const source = fs.readFileSync(file, 'utf8');
const before = "if (NativeJSLogger) {";
const after = "if (NativeJSLogger && typeof NativeJSLogger.addListener === 'function') {";

if (source.includes(after)) {
  console.log('[fix-expo-jslogger] already patched');
  process.exit(0);
}

if (!source.includes(before)) {
  console.log('[fix-expo-jslogger] expected pattern not found, skipping');
  process.exit(0);
}

const next = source.replace(before, after);
fs.writeFileSync(file, next);
console.log('[fix-expo-jslogger] patch applied');
