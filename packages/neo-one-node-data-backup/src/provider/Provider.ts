import { Monitor } from '@neo-one/monitor';

export class Provider {
  public async canRestore(): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  public async restore(_monitor: Monitor): Promise<void> {
    throw new Error('Not Implemented');
  }

  public async backup(_monitor: Monitor): Promise<void> {
    throw new Error('Not Implemented');
  }
}
