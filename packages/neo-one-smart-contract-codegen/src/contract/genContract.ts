import { SmartContractNetworksDefinition } from '@neo-one/client';
import stringify from 'safe-stable-stringify';
import { getABIName } from '../abi';
import { getReadSmartContractName, getSmartContractName } from '../types';
import { getRelativeImport } from '../utils';
import { getCreateReadSmartContractName } from './getCreateReadSmartContractName';
import { getCreateSmartContractName } from './getCreateSmartContractName';

export const genContract = ({
  name,
  createContractPath,
  typesPath,
  sourceMapsPath,
  abiPath,
  networksDefinition,
}: {
  readonly name: string;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly abiPath: string;
  readonly sourceMapsPath: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
}) => {
  const relativeTypes = getRelativeImport(createContractPath, typesPath);
  const smartContract = getSmartContractName(name);
  const readSmartContract = getReadSmartContractName(name);
  const relativeABI = getRelativeImport(createContractPath, abiPath);
  const relativeSourceMaps = getRelativeImport(createContractPath, sourceMapsPath);
  const abiName = getABIName(name);
  const sourceMapsImport = `import { sourceMaps } from '${relativeSourceMaps}';`;

  return {
    js: `${abiName >= 'sourceMaps' ? `${sourceMapsImport}\n` : ''}import { ${abiName} } from '${relativeABI}';${
      abiName >= 'sourceMaps' ? '' : `\n${sourceMapsImport}`
    }

const definition = {
  networks: ${stringify(networksDefinition, undefined, 2)},
  abi: ${abiName},
  sourceMaps,
};

export const ${getCreateSmartContractName(name)} = (
  client,
) => client.smartContract(definition);

export const ${getCreateReadSmartContractName(name)} = (
  client,
) => client.smartContract({
  address: definition.networks[client.dataProvider.network].address,
  abi: definition.abi,
  sourceMaps: definition.sourceMaps,
});
  `,
    ts: `
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';${
      abiName >= 'sourceMaps' ? sourceMapsImport : ''
    }
import { ${abiName} } from '${relativeABI}';
import { ${readSmartContract}, ${smartContract} } from '${relativeTypes}';${
      abiName >= 'sourceMaps' ? '' : sourceMapsImport
    }

const definition: SmartContractDefinition = {
  networks: ${stringify(networksDefinition, undefined, 2)},
  abi: ${abiName},
  sourceMaps,
};

export const ${getCreateSmartContractName(name)} = (
  client: Client,
): ${smartContract} => client.smartContract<${smartContract}>(definition);

export const ${getCreateReadSmartContractName(name)} = (
  client: ReadClient,
): ${readSmartContract} => client.smartContract<${readSmartContract}>({
  address: definition.networks[client.dataProvider.network].address,
  abi: definition.abi,
  sourceMaps: definition.sourceMaps,
});
`,
  };
};
