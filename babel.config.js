module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Support for private class methods used by React Native internals
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-proposal-private-methods', { loose: true }],
      // Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};
