// tslint:disable no-submodule-imports match-default-export-name
import loaderUtils from 'loader-utils';
import webpack from 'webpack';
import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import WebWorkerTemplatePlugin from 'webpack/lib/webworker/WebWorkerTemplatePlugin';

export function workerLoader() {
  // do nothing
}

export namespace workerLoader {
  export function pitch(this: webpack.loader.LoaderContext, request: string) {
    try {
      compile(this, request);
    } catch (e) {
      // tslint:disable-next-line no-console
      console.error(e, e.stack);
      throw e;
    }
  }
}

export function compile(loader: webpack.loader.LoaderContext, request: string) {
  const optionsIn = loaderUtils.getOptions(loader) as loaderUtils.OptionObject | null | undefined;
  const options = optionsIn == undefined ? {} : optionsIn;

  loader.cacheable(false);

  const callback = loader.async();
  if (callback === undefined) {
    return;
  }

  const filename = loaderUtils.interpolateName(loader, options.name === undefined ? '[hash].worker.js' : options.name, {
    // tslint:disable-next-line no-any
    context: options.context || (loader as any).rootContext || (loader as any).options.context,
    regExp: options.regExp,
  });

  const workerOptions = {
    filename,
    chunkFilename: `[id].${filename}`,
  };
  const compiler: webpack.Compiler = loader._compilation.createChildCompiler('worker', workerOptions);

  // Tapable.apply is deprecated in tapable@1.0.0-x.
  // The plugins should now call apply themselves.
  new WebWorkerTemplatePlugin(workerOptions).apply(compiler);

  if (loader.target !== 'webworker' && loader.target !== 'web') {
    new NodeTargetPlugin().apply(compiler);
  }

  new SingleEntryPlugin(loader.context, `!!${request}`, 'main').apply(compiler);

  const subCache = `subcache ${__dirname} ${request}`;

  compiler.hooks.compilation.tap('WorkerLoader', (compilation) => {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) {
        // tslint:disable-next-line no-object-mutation
        compilation.cache[subCache] = {};
      }

      // tslint:disable-next-line no-object-mutation
      compilation.cache = compilation.cache[subCache];
    }
  });

  // tslint:disable-next-line no-any
  (compiler as any).runAsChild((err: any, entries: any) => {
    if (err) {
      callback(err);

      return;
    }

    if (entries[0]) {
      const file = entries[0].files[0];

      const factory = getWorker(file, options);

      if (options.fallback === false) {
        // tslint:disable-next-line no-object-mutation no-dynamic-delete
        delete loader._compilation.assets[file];
      }

      callback(undefined, factory);

      return;
    }

    callback(undefined, undefined);

    return;
  });
}

interface Options {
  readonly publicPath?: string;
  readonly mode?: 'service' | 'shared' | 'web';
}

const getWorker = (file: string, options: Options) => {
  const publicPath = options.publicPath === undefined ? '__webpack_public_path__' : options.publicPath;
  const publicWorkerPath = `${publicPath} + ${JSON.stringify(file)}`;

  if (options.mode === 'shared') {
    return `module.exports = function() {
  return new SharedWorker(${publicWorkerPath});
};`;
  }

  if (options.mode === 'service') {
    return `module.exports = ${publicWorkerPath};`;
  }

  return `module.exports = function() {
    console.log('hello world');
  return new Worker(${publicWorkerPath});
};`;
};
