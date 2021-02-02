import { ContractManifestClient } from '@neo-one/client-common';
import stringify from 'safe-stable-stringify';
import { getManifestName } from './getManifestName';

export const genManifest = (name: string, manifest: ContractManifestClient) => ({
  js: `export const ${getManifestName(name)} = ${stringify(manifest, undefined, 2)};`,
  ts: `import { ContractManifestClient } from '@neo-one/client';

export const ${getManifestName(name)}: ContractManifestClient = ${stringify(manifest, undefined, 2)};
`,
});
