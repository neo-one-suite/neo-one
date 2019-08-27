import {
  ForwardOptions,
  GetOptions,
  Param,
  TransactionOptions,
  UserAccountID,
  Transfer,
  Hash256String,
} from '@neo-one/client-common';
import { Deferred } from './createDeferred';

export type MigrationContractsBase = object;

export type Migration<Contracts extends MigrationContractsBase> = (
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
  readonly forwardOptions?: ForwardOptions<any>;
  readonly transfer?: Transfer;
  readonly hash?: Hash256String;
  readonly deferred: Deferred;
}
