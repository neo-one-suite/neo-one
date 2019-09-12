'use strict';

const build = require('@neo-one/build-tools');
const path = require('path');

build.copyStaticTask.glob = ['static/**/*'];
build.copyStaticTask.options = {
  dest: path.join('lib', 'static'),
};
build.copyStaticTask.enabled = true;

build.initialize();
