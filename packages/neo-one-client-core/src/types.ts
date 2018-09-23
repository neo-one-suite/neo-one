import {
  Action,
  Event,
  Log,
  RawAction,
  SmartContractDefinition,
  SmartContractIterOptions,
} from '@neo-one/client-common';
import { Client } from './Client';

// tslint:disable-next-line no-any
export interface SmartContract<TClient extends Client = Client, TEvent extends Event<string, any> = Event> {
  readonly definition: SmartContractDefinition;
  readonly client: TClient;
  readonly iterEvents: (options?: SmartContractIterOptions) => AsyncIterable<TEvent>;
  readonly iterLogs: (options?: SmartContractIterOptions) => AsyncIterable<Log>;
  readonly iterActions: (options?: SmartContractIterOptions) => AsyncIterable<Action>;
  readonly convertAction: (action: RawAction) => Action | undefined;
}

export interface SmartContractAny extends SmartContract {
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}
