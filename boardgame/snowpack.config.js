/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/' },
  },
  plugins: [
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
  ],
  routes: [
    { 'match': 'routes', 'src': '.*', 'dest': '/index.html' },
  ],
  optimize: {
    bundle: true,
    treeshake: true,
    minify: true,
  },
  packageOptions: {},
  devOptions: {},
  buildOptions: {},
};
