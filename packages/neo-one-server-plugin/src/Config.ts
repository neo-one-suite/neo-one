import * as fs from 'fs-extra';
import * as path from 'path';
import { defer, Observable, Observer } from 'rxjs';
import { distinctUntilChanged, mergeScan, switchMap } from 'rxjs/operators';
import SeamlessImmutable from 'seamless-immutable';

type Event = 'change';

const watchConfig$ = (file: string): Observable<Event> =>
  Observable.create((observer: Observer<string>) => {
    // import('chokidar').FSWatcher
    // tslint:disable-next-line no-any
    let watcher: any | undefined;
    let closed = false;
    import('chokidar')
      .then((chokidar) => {
        if (!closed) {
          watcher = chokidar.watch(file, { ignoreInitial: false });
          watcher.on('add', () => {
            observer.next('change');
          });
          watcher.on('change', () => {
            observer.next('change');
          });
          watcher.on('error', (error: Error) => {
            observer.error(error);
          });
          watcher.on('unlink', () => {
            observer.error(new Error('Configuration file deleted.'));
          });
        }
      })
      .catch((error) => observer.error(error));

    return () => {
      closed = true;
      if (watcher !== undefined) {
        watcher.close();
      }
    };
  });

export class Config<TConfig extends object> {
  public readonly config$: Observable<TConfig>;
  public readonly configPath: string;
  private readonly defaultConfig: TConfig;
  // tslint:disable-next-line no-any
  private readonly schema: any;
  // tslint:disable-next-line no-any
  private mutableValidateConfig: any;

  public constructor({
    name: configName,
    defaultConfig,
    schema,
    configPath,
  }: {
    readonly name: string;
    readonly defaultConfig: TConfig;
    // tslint:disable-next-line no-any
    readonly schema: any;
    readonly configPath: string;
  }) {
    this.configPath = path.resolve(configPath, `${configName}.json`);
    this.defaultConfig = defaultConfig;
    this.schema = schema;
    this.config$ = defer(async () => this.getConfig()).pipe(
      switchMap((config) =>
        watchConfig$(this.configPath).pipe(
          mergeScan((prevConfig) => defer(async () => this.getConfig({ config: prevConfig })), config, 1),
        ),
      ),

      distinctUntilChanged(),
    );
  }

  public async update({ config }: { readonly config: TConfig }): Promise<TConfig> {
    await this.validate(config);
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeFile(this.configPath, JSON.stringify(config));

    return config;
  }

  private async getConfig({ config = this.defaultConfig }: { readonly config?: TConfig } = {}): Promise<TConfig> {
    let contents;
    try {
      contents = await fs.readFile(this.configPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.update({ config });
      }

      throw error;
    }

    const currentConfig = JSON.parse(contents);
    await this.validate(currentConfig);

    if (config !== undefined) {
      // tslint:disable-next-line no-any
      return (SeamlessImmutable as any).merge(config, currentConfig, {
        deep: true,
      });
    }

    return currentConfig;
  }

  private async validate(config: TConfig): Promise<void> {
    const validateConfig = await this.getValidateConfig();
    const isValid = validateConfig(config);
    if (!isValid) {
      const error = new Error('Invalid config');
      // tslint:disable-next-line no-object-mutation no-any
      (error as any).errors = validateConfig.errors;
      throw error;
    }
  }

  // Promise<import('ajv').ValidateFunction>
  // tslint:disable-next-line no-any
  private async getValidateConfig(): Promise<any> {
    if (this.mutableValidateConfig !== undefined) {
      return this.mutableValidateConfig;
    }

    const ajv = await import('ajv');
    // tslint:disable-next-line no-any
    const validateConfig = new ajv.default().compile(this.schema);
    this.mutableValidateConfig = validateConfig;

    return validateConfig;
  }
}
