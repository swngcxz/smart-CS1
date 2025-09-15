module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxRuntime: 'automatic'
      }],
    ],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@hooks': './hooks',
            '@utils': './utils',
            '@types': './types',
          },
        },
      ],
    ],
  };
};