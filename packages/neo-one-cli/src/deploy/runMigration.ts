import { SmartContractAny } from '@neo-one/client-core';
import { Client } from '@neo-one/client-full-core';
import _ from 'lodash';
import { createMigrationContracts } from './createMigrationContracts';
import { Migration } from './types';

export const runMigration = async <Contracts extends SmartContractAny>(
  migration: Migration<Contracts>,
  contracts: Contracts,
  client: Client,
  network: string,
) => {
  const { contracts: migrationContracts } = createMigrationContracts(
    _.fromPairs(Object.entries(contracts).map(([name, contract]) => [name, contract.definition.abi])),
  );
  migration(
    migrationContracts as any,
    network,
    client
      .getUserAccounts()
      .map(({ id }) => id)
      .filter((id) => id.network === network),
  );
};
