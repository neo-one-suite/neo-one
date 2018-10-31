import { SmartContractNetworksDefinition } from '@neo-one/client-common';
import stringify from 'safe-stable-stringify';
import { getABIName } from '../abi';
import { getSmartContractName } from '../types';
import { getRelativeImport } from '../utils';
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
  `,
    ts: `
import { Client, SmartContractDefinition } from '@neo-one/client';${abiName >= 'sourceMaps' ? sourceMapsImport : ''}
import { ${abiName} } from '${relativeABI}';
import { ${smartContract} } from '${relativeTypes}';${abiName >= 'sourceMaps' ? '' : sourceMapsImport}

const definition: SmartContractDefinition = {
  networks: ${stringify(networksDefinition, undefined, 2)},
  abi: ${abiName},
  sourceMaps,
};

export const ${getCreateSmartContractName(name)} = <TClient extends Client>(
  client: TClient,
): ${smartContract}<TClient> => client.smartContract<${smartContract}<TClient>>(definition);
`,
  };
};
