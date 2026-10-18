// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * zustand 5 ships an ESM build (`esm/*.mjs`) that reads `import.meta.env` in its devtools
 * middleware. Metro's web bundle is not an ES module, so that line throws
 * "Cannot use 'import.meta' outside a module" and the page renders blank. Native is unaffected
 * (Expo polyfills import.meta on Hermes). On web, resolve zustand to its CommonJS build instead.
 */
const zustandDir = path.dirname(require.resolve('zustand/package.json'));
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'zustand' || moduleName.startsWith('zustand/'))) {
    const sub = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    return { type: 'sourceFile', filePath: path.join(zustandDir, `${sub}.js`) };
  }
  return defaultResolveRequest ? defaultResolveRequest(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
