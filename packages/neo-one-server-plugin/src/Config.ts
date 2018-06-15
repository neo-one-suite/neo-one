import ajv from 'ajv';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import { defer, Observable } from 'rxjs';
import { Observer } from 'rxjs/Observer';
import { distinctUntilChanged, mergeScan, switchMap } from 'rxjs/operators';
import SeamlessImmutable from 'seamless-immutable';

const ajvValue = new ajv();
type Event = 'change';

const watchConfig$ = (file: string): Observable<Event> =>
  Observable.create((observer: Observer<string>) => {
    const watcher = chokidar.watch(file, { ignoreInitial: false });
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

    return () => {
      watcher.close();
    };
  });

export class Config<TConfig extends object> {
  public readonly config$: Observable<TConfig>;
  protected readonly configPath: string;
  private readonly defaultConfig: TConfig;
  // tslint:disable-next-line no-any
  private readonly validateConfig: any;

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
    this.validateConfig = ajvValue.compile(schema);
    this.config$ = defer(async () => this.getConfig()).pipe(
      switchMap((config) =>
        watchConfig$(this.configPath).pipe(
          mergeScan((prevConfig) => defer(async () => this.getConfig({ config: prevConfig })), config, 1),
        ),
      ),

      distinctUntilChanged(),
    );

    this.validate(this.defaultConfig);
  }

  public async update({ config }: { readonly config: TConfig }): Promise<TConfig> {
    this.validate(config);
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
    this.validate(currentConfig);

    if (config !== undefined) {
      // tslint:disable-next-line no-any
      return (SeamlessImmutable as any).merge(config, currentConfig, {
        deep: true,
      });
    }

    return currentConfig;
  }

  private validate(config: TConfig): void {
    const isValid = this.validateConfig(config);
    if (!isValid) {
      const error = new Error('Invalid config');
      // tslint:disable-next-line no-object-mutation no-any
      (error as any).errors = this.validateConfig.errors;
      throw error;
    }
  }
}
