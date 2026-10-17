const fs = require('fs');
const path = require('path');

const expoLoggerFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'src',
  'sweet',
  'setUpJsLogger.fx.ts'
);

if (!fs.existsSync(expoLoggerFile)) {
  console.log('[fix-expo-jslogger] target file not found, skipping');
} else {
  const source = fs.readFileSync(expoLoggerFile, 'utf8');
  const before = "if (NativeJSLogger) {";
  const after = "if (NativeJSLogger && typeof NativeJSLogger.addListener === 'function') {";

  if (source.includes(after)) {
    console.log('[fix-expo-jslogger] already patched');
  } else if (!source.includes(before)) {
    console.log('[fix-expo-jslogger] expected pattern not found, skipping');
  } else {
    fs.writeFileSync(expoLoggerFile, source.replace(before, after));
    console.log('[fix-expo-jslogger] patch applied');
  }
}

// Zustand 5's ESM middleware uses Vite-only `import.meta.env`. Metro serves
// its development web bundle as a classic script, so the syntax prevents the
// entire React tree from mounting. Use the cross-bundler NODE_ENV equivalent.
const zustandMiddlewareFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'zustand',
  'esm',
  'middleware.mjs'
);

if (fs.existsSync(zustandMiddlewareFile)) {
  const source = fs.readFileSync(zustandMiddlewareFile, 'utf8');
  const before = '(import.meta.env ? import.meta.env.MODE : void 0)';
  if (source.includes(before)) {
    fs.writeFileSync(zustandMiddlewareFile, source.split(before).join('process.env.NODE_ENV'));
    console.log('[fix-expo-jslogger] zustand Metro web patch applied');
  } else {
    console.log('[fix-expo-jslogger] zustand Metro web patch already applied');
  }
}
