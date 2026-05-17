const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Expo can resolve package "exports" to source paths that break @react-navigation/stack
// sub-imports on Windows. Force the compiled lib entry when bundling the app.
const stackRoot = path.dirname(
  require.resolve('@react-navigation/stack/package.json'),
);
const stackEntry = path.join(stackRoot, 'lib/module/index.js');

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@react-navigation/stack') {
    return { type: 'sourceFile', filePath: stackEntry };
  }
  if (typeof defaultResolveRequest === 'function') {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
