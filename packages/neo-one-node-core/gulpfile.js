'use strict';

const build = require('@neo-one/build-tools');

build.compileTypescriptTask.options = {
  stripInternal: true,
};

build.initialize();
