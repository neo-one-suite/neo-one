import { Blockchain as IBlockchain, Storage, VM } from '@neo-one/node-core';
import { InvocationResult } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';

declare interface CreateBlockchainOptions {
  settings: IBlockchain['settings'];
  storage: Storage;
  vm: VM;
  monitor: Monitor;
}
declare class Blockchain implements IBlockchain {
  settings: IBlockchain['settings'];
  invokeScript(buffer: Buffer, monitor?: Monitor): Promise<InvocationResult>;
  static create(options: CreateBlockchainOptions): Promise<Blockchain>;
}

export default Blockchain;
