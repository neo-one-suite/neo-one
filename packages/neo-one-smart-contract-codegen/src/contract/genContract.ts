import { SmartContractNetworksDefinition } from '@neo-one/client';
import stringify from 'safe-stable-stringify';
import { RawSourceMap } from 'source-map';
import { getABIName } from '../abi';
import { getReadSmartContractName, getSmartContractName } from '../types';
import { getRelativeImport } from '../utils';
import { getCreateReadSmartContractName } from './getCreateReadSmartContractName';
import { getCreateSmartContractName } from './getCreateSmartContractName';

export const genContract = ({
  name,
  createContractPath,
  typesPath,
  abiPath,
  networksDefinition,
  sourceMap,
}: {
  readonly name: string;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly abiPath: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
  readonly sourceMap: RawSourceMap;
}): string => {
  const relativeTypes = getRelativeImport(createContractPath, typesPath);
  const smartContract = getSmartContractName(name);
  const readSmartContract = getReadSmartContractName(name);
  const relativeABI = getRelativeImport(createContractPath, abiPath);
  const abiName = getABIName(name);

  return `
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { ${abiName} } from '${relativeABI}';
import { ${readSmartContract}, ${smartContract} } from '${relativeTypes}';

const definition: SmartContractDefinition = {
  networks: ${stringify(networksDefinition, undefined, 2)},
  abi: ${abiName},
};

export const ${getCreateSmartContractName(name)} = (
  client: Client,
): ${smartContract} => client.smartContract<${smartContract}>(definition);

export const ${getCreateReadSmartContractName(name)} = (
  client: ReadClient,
): ${readSmartContract} => client.smartContract<${readSmartContract}>({
  address: definition.networks[client.dataProvider.network].address,
  abi: definition.abi,
  sourceMap: definition.sourceMap,
});

if (process.env.NODE_ENV !== 'production') {
  (definition as any).sourceMap = ${stringify(sourceMap, undefined, 2)}
}
`;
};
