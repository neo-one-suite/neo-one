export const wasmFileLoader = {
  loader: 'file-loader',
  test: /.*file-loader.*\.wasm$/,
  type: 'javascript/auto',
  options: {
    name: 'static/[name].[hash:8].[ext]',
  },
};
