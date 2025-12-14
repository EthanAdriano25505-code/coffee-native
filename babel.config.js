module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // add any other plugins you need above this line
      // IMPORTANT: react-native-reanimated/plugin MUST be the last plugin
      'react-native-reanimated/plugin'
      
    ],
  };
};