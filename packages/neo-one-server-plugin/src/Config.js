/* @flow */
import Ajv from 'ajv';
import Immutable from 'seamless-immutable';
import { Observable } from 'rxjs/Observable';

import chokidar from 'chokidar';
import { defer } from 'rxjs/observable/defer';
import { distinctUntilChanged, mergeScan, switchMap } from 'rxjs/operators';
import fs from 'fs-extra';
import path from 'path';

const ajv = new Ajv();

type Event = 'change';
const watchConfig$ = (file: string): Observable<Event> =>
  Observable.create(observer => {
    const watcher = chokidar.watch(file, { ignoreInitial: false });
    watcher.on('add', () => {
      observer.next('change');
    });
    watcher.on('change', () => {
      observer.next('change');
    });
    watcher.on('error', error => {
      observer.error(error);
    });
    watcher.on('unlink', () => {
      observer.error(new Error('Configuration file deleted.'));
    });
    return () => {
      watcher.close();
    };
  });

export default class Config<TConfig: Object> {
  _configPath: string;
  _defaultConfig: TConfig;
  _validateConfig: any;

  config$: Observable<TConfig>;

  constructor({
    name: configName,
    defaultConfig,
    schema,
    configPath,
  }: {|
    name: string,
    defaultConfig: TConfig,
    schema: Object,
    configPath: string,
  |}) {
    this._configPath = path.resolve(configPath, `${configName}.json`);
    this._defaultConfig = defaultConfig;
    this._validateConfig = ajv.compile(schema);
    this.config$ = defer(() => this._getConfig()).pipe(
      switchMap(config =>
        watchConfig$(this._configPath).pipe(
          mergeScan(
            prevConfig => defer(() => this._getConfig({ config: prevConfig })),
            config,
            1,
          ),
        ),
      ),
      distinctUntilChanged(),
    );

    this._validate(this._defaultConfig);
  }

  async update({ config }: {| config: TConfig |}): Promise<void> {
    this._validate(config);
    await fs.ensureDir(path.dirname(this._configPath));
    await fs.writeFile(this._configPath, JSON.stringify(config));
    return config;
  }

  async _getConfig(options?: {| config?: TConfig |}): Promise<TConfig> {
    const { config: configIn } = options || {};
    const config = configIn || this._defaultConfig;
    let contents;
    try {
      contents = await fs.readFile(this._configPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        const result = await this.update({ config });
        return result;
      }

      throw error;
    }

    const currentConfig = JSON.parse(contents);
    this._validate(currentConfig);

    if (config != null) {
      return Immutable.merge(config, currentConfig, {
        deep: true,
      });
    }
    return currentConfig;
  }

  _validate(config: TConfig): void {
    const isValid = this._validateConfig(config);
    if (!isValid) {
      const error = new Error('Invalid config');
      // $FlowFixMe
      error.errors = this._validateConfig.errors;
      throw error;
    }
  }
}
