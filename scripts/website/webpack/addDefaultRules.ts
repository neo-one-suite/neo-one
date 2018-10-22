import webpack from 'webpack';

// tslint:disable-next-line no-any
export const addDefaultRules = (mutableConfig: any): webpack.Configuration => {
  mutableConfig.module.defaultRules = [
    {
      type: 'javascript/auto',
      resolve: {},
    },
    {
      test: /\.json$/i,
      type: 'json',
    },
  ];

  return mutableConfig;
};
