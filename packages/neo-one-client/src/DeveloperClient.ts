import { RawSourceMap } from 'source-map';
import { ClientBase } from './ClientBase';
import {
  BufferString,
  DeveloperProvider,
  InvocationTransaction,
  InvokeTransactionOptions,
  Options,
  RawInvokeReceipt,
  UserAccountProvider,
} from './types';

export class DeveloperClient<
  // tslint:disable-next-line no-any
  TUserAccountProviders extends { readonly [K in string]: UserAccountProvider } = any
> extends ClientBase<TUserAccountProviders> {
  private readonly developerProvider: DeveloperProvider;

  public constructor(developerProvider: DeveloperProvider, providersIn: TUserAccountProviders) {
    super(providersIn);
    this.developerProvider = developerProvider;
  }

  public async runConsensusNow(): Promise<void> {
    await this.developerProvider.runConsensusNow();
  }

  public async updateSettings(options: Options): Promise<void> {
    await this.developerProvider.updateSettings(options);
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardOffset(seconds);
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardToTime(seconds);
  }

  public async reset(): Promise<void> {
    await this.developerProvider.reset();
  }

  public async execute(
    script: BufferString,
    options?: InvokeTransactionOptions,
    sourceMap?: RawSourceMap,
  ): Promise<{ readonly receipt: RawInvokeReceipt; readonly transaction: InvocationTransaction }> {
    const result = await this.getProvider(options).execute(script, options, sourceMap);

    const [invokeReceipt] = await Promise.all([
      result.confirmed({ timeoutMS: 5000 }),
      this.developerProvider.runConsensusNow(),
    ]);

    if (invokeReceipt.result.state === 'FAULT') {
      throw new Error(invokeReceipt.result.message);
    }

    return { receipt: invokeReceipt, transaction: result.transaction };
  }
}
