export const fileLoader = () => ({
  loader: 'url-loader',
  exclude: [/\.ts$/, /\.tsx$/, /\.js$/, /\.jsx$/, /\.html$/, /\.json$/],
  query: {
    limit: 10000,
    name: 'static/[name].[hash:8].[ext]',
  },
});
