// tslint:disable no-any
import {
  ForwardOptions,
  GetOptions,
  Hash256String,
  Param,
  TransactionOptions,
  Transfer,
  UserAccountID,
} from '@neo-one/client-common';
import { Deferred } from './createDeferred';

export type MigrationContractsBase = object;

export type Migration<Contracts extends MigrationContractsBase = MigrationContractsBase> = (
  contracts: Contracts,
  network: string,
  userAccountIDs: readonly UserAccountID[],
) => void;

export type MigrationParam = Param | Promise<Param>;

export interface Action {
  readonly contract: string;
  readonly method: string;
  readonly params: readonly MigrationParam[];
  readonly options?: TransactionOptions & GetOptions;
  readonly forwardOptions?: ForwardOptions;
  readonly transfer?: Transfer;
  readonly hash?: Hash256String;
  readonly deferred: Deferred;
  readonly args: readonly any[];
}
