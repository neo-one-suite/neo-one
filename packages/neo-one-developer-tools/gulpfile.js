'use strict';

const build = require('@neo-one/build-tools');

build.rollupToolsTask.enabled = true;
build.compileBinTask.enabled = false;
build.copyStaticTask.enabled = false;

build.initialize();
