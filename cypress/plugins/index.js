const webpack = require('../../common/temp/node_modules/@cypress/webpack-preprocessor');
const {
  addSeconds,
  format,
  parse,
} = require('../../common/temp/node_modules/date-fns');
const nanoid = require('../../common/temp/node_modules/nanoid');
const fs = require('../../common/temp/node_modules/fs-extra');
const istanbul = require('../../common/temp/node_modules/istanbul-lib-coverage');
const path = require('path');

module.exports = (on) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.js'],
        modules: ['./common/temp/node_modules'],
      },
      resolveLoader: {
        modules: ['./common/temp/node_modules'],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                  happyPackMode: false,
                  configFile: path.resolve(__dirname, '..', 'tsconfig.json'),
                  onlyCompileBundledFiles: true,
                  experimentalFileCaching: true,
                  experimentalWatchApi: true,
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
