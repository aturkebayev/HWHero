module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // SDK 54 / reanimated 4: worklets plugin lives in its own package and must
    // be the LAST plugin in the list.
    plugins: ['react-native-worklets/plugin'],
  };
};
