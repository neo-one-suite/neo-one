import { Disposable } from '@neo-one/utils';
import { FullNodeOptions, startFullNode } from './startFullNode';

export class FullNode {
  private readonly options: FullNodeOptions;
  private mutableDisposable: Disposable | undefined;

  public constructor(options: FullNodeOptions) {
    this.options = options;
  }

  public async start(): Promise<void> {
    if (this.mutableDisposable === undefined) {
      this.mutableDisposable = await startFullNode(this.options);
    }
  }

  public async stop(): Promise<void> {
    if (this.mutableDisposable !== undefined) {
      await this.mutableDisposable();
      this.mutableDisposable = undefined;
    }
  }
}
