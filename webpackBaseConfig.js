const path = require("path");

module.exports = {
  context: path.resolve(__dirname),
  resolve: {
    modules: [__dirname, "node_modules"],
    alias: {
      "@harvest/core": path.resolve(__dirname, "./packages/core"),
      "@harvest/router": path.resolve(__dirname, "./packages/router"),
    },
    extensions: [".js"],
  },
};
