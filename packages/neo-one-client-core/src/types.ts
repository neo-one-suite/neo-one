// tslint:disable no-any
import { Event, Log, RawAction, SmartContractDefinition, SmartContractIterOptions } from '@neo-one/client-common';
import { Client } from './Client';

/**
 * An object representing a smart contract defined by the `definition` property, in particular, the `ABI` of the definition.
 */
export interface SmartContract<TClient extends Client = Client, TEvent extends Event<string, any> = Event> {
  /**
   * The `SmartContractDefinition` that generated this `SmartContract` object.
   */
  readonly definition: SmartContractDefinition;
  /**
   * The underlying `Client` used by this `SmartContract`.
   */
  readonly client: TClient;
  /**
   * Iterate over the events emitted by the smart contract.
   *
   * @returns an `AsyncIterable` over the events emitted by the smart contract.
   */
  readonly iterEvents: (options?: SmartContractIterOptions) => AsyncIterable<TEvent>;
  /**
   * Iterate over the logs emitted by the smart contract.
   *
   * @returns an `AsyncIterable` over the logs emitted by the smart contract.
   */
  readonly iterLogs: (options?: SmartContractIterOptions) => AsyncIterable<Log>;
  /**
   * Iterate over the events and logs emitted by the smart contract.
   *
   * @returns an `AsyncIterable` over the events and logs emitted by the smart contract.
   */
  readonly iterActions: (options?: SmartContractIterOptions) => AsyncIterable<TEvent | Log>;
  /**
   * Converts a `RawAction`, typically from the raw results found in a `Block` to a processed `Action` or `undefined` if the action is not recognized by the ABI.
   *
   * @returns `Action` if the `action` parameter is recognized by the `ABI` of the smart contract, `undefined` otherwise.
   */
  readonly convertAction: (action: RawAction) => TEvent | Log | undefined;
}

export interface SmartContractAny extends SmartContract {
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}
