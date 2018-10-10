const webpack = require('@cypress/webpack-preprocessor');
const { addSeconds, format, parse } = require('date-fns');
const nanoid = require('nanoid');
const fs = require('fs-extra');
const istanbul = require('istanbul-lib-coverage');
const path = require('path');

module.exports = (on) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.js'],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'awesome-typescript-loader',
                options: {
                  useTranspileModule: true,
                  transpileOnly: true,
                  useBabel: false,
                  useCache: true,
                  configFileName: path.resolve(__dirname, '..', 'tsconfig.json'),
                },
              },
            ],
          },
        ],
      },
    },
  };
  on('file:preprocessor', webpack(options));

  on('task', {
    addSeconds: ({ value, offset }) => {
      const dateFormat = 'yyyy/MM/dd hh:mm:ss a';
      const date = parse(value, dateFormat, new Date());
      const dateOffset = addSeconds(date, offset);
      const formatted = format(dateOffset, dateFormat);
      return {
        formatted,
        time: dateOffset.valueOf(),
      };
    },

    writeCoverage: ({ coverage, coverageDir }) => {
      fs.ensureDirSync(coverageDir);
      fs.writeFileSync(
        path.resolve(coverageDir, `${nanoid()}.json`),
        JSON.stringify(istanbul.createCoverageMap(coverage)),
      );

      return null;
    },
  });
};
