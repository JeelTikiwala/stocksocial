const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      '.expo/**',
      'backend/**',
      'node_modules/**',
      'trading-engine/**',
    ],
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
];
