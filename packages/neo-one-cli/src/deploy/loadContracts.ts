import { Configuration } from '@neo-one/cli-common';
import { Client } from '@neo-one/client-full-core';

export const loadContracts = async (config: Configuration, client: Client) => {
  const contracts = await import(`${config.codegen.path}/contracts`);

  return contracts.createContracts(client);
};
