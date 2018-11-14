export const fileLoader = () => ({
  loader: 'url-loader',
  exclude: [/\.ts$/, /\.tsx$/, /\.js$/, /\.jsx$/, /\.html$/, /\.json$/],
  query: {
    // 35kb to include background image
    limit: 35000,
    name: 'static/[name].[hash:8].[ext]',
  },
});
