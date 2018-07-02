import { Monitor } from '@neo-one/monitor';
import * as fs from 'fs-extra';
import { Environment } from '../types';
import { Provider } from './Provider';

export class MultiProvider extends Provider {
  private readonly providers: ReadonlyArray<Provider>;
  private readonly environment: Environment;

  public constructor({
    providers,
    environment,
  }: {
    readonly providers: ReadonlyArray<Provider>;
    readonly environment: Environment;
  }) {
    super();
    this.providers = providers;
    this.environment = environment;
  }

  public async restore(monitor: Monitor): Promise<void> {
    // tslint:disable-next-line no-loop-statement
    for (const provider of this.providers) {
      const canRestore = await provider.canRestore();
      if (canRestore) {
        await provider.restore(monitor);
        break;
      }
    }
  }

  public async backup(monitor: Monitor): Promise<void> {
    // tslint:disable-next-line no-loop-statement
    for (const provider of this.providers) {
      await provider.backup(monitor);
      await fs.remove(this.environment.tmpPath);
      await fs.ensureDir(this.environment.tmpPath);
    }
  }
}
