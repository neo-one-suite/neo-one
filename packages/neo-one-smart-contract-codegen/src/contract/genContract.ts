import { SmartContractNetworksDefinition } from '@neo-one/client-common';
import stringify from 'safe-stable-stringify';
import { getManifestName } from '../manifest';
import { getSmartContractName } from '../types';
import { getRelativeImport } from '../utils';
import { getCreateSmartContractName } from './getCreateSmartContractName';

export const genContract = ({
  name,
  createContractPath,
  typesPath,
  sourceMapsPath,
  manifestPath,
  networksDefinition,
}: {
  readonly name: string;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly manifestPath: string;
  readonly sourceMapsPath: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
}) => {
  const relativeTypes = getRelativeImport(createContractPath, typesPath);
  const smartContract = getSmartContractName(name);
  const relativeManifest = getRelativeImport(createContractPath, manifestPath);
  const relativeSourceMaps = getRelativeImport(createContractPath, sourceMapsPath);
  const manifestName = getManifestName(name);

  return {
    js: `import { ${manifestName} } from '${relativeManifest}';
import { sourceMaps } from '${relativeSourceMaps}';

const definition = {
  networks: ${stringify(networksDefinition, undefined, 2)},
  manifest: ${manifestName},
  sourceMaps,
};

export const ${getCreateSmartContractName(name)} = (
  client,
) => client.smartContract(definition);
  `,
    ts: `
import { Client } from '@neo-one/client';
import { ${smartContract} } from '${relativeTypes}';
import { ${manifestName} } from '${relativeManifest}';
import { sourceMaps } from '${relativeSourceMaps}';

const definition = {
  networks: ${stringify(networksDefinition, undefined, 2)},
  manifest: ${manifestName},
  sourceMaps,
};

export const ${getCreateSmartContractName(name)} = <TClient extends Client>(
  client: TClient,
): ${smartContract}<TClient> => client.smartContract(definition);
`,
  };
};
