'use strict';

const build = require('@neo-one/build-tools');
const path = require('path');

build.copyStaticTask.glob = ['static/**/*'];
build.copyStaticTask.options = {
  dest: 'static',
};

build.copyStaticTask.enabled = true;

build.initialize();
