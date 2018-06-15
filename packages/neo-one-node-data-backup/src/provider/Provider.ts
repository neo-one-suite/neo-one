import { Monitor } from '@neo-one/monitor';

export class Provider {
  public async canRestore(): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  // tslint:disable-next-line no-unused
  public async restore(monitor: Monitor): Promise<void> {
    throw new Error('Not Implemented');
  }

  // tslint:disable-next-line no-unused
  public async backup(monitor: Monitor): Promise<void> {
    throw new Error('Not Implemented');
  }
}
