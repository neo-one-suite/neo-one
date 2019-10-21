'use strict';

const build = require('@neo-one/build-tools');

build.copyStaticTask.enabled = true;

build.compileTypescriptTask.enabled = false;

build.initialize();
