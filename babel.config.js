function stripDevPreviewRouter({ types }) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value === './src/experiments/DevPreviewRouter') path.remove();
      },
      JSXElement(path) {
        const name = path.node.openingElement.name;
        if (!types.isJSXIdentifier(name, { name: 'DevPreviewRouter' })) return;
        const children = path.node.children.filter((child) => !types.isJSXText(child) || child.value.trim().length > 0);
        path.replaceWithMultiple(children);
      },
    },
  };
}

module.exports = function (api) {
  const environment = api.env();
  const includeDevPreviews = environment !== 'production' || process.env.IGLOO_INCLUDE_DEV_PREVIEWS === '1';
  api.cache.using(() => `${environment}:${process.env.IGLOO_INCLUDE_DEV_PREVIEWS ?? ''}`);
  const plugins = [];
  if (!includeDevPreviews) plugins.push(stripDevPreviewRouter);
  plugins.push('react-native-worklets/plugin');
  return { presets: ['babel-preset-expo'], plugins };
};
