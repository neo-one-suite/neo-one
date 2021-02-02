import { ContractManifestClient, SmartContractNetworksDefinition } from '@neo-one/client-common';
import { genContract } from './contract';
import { formatFile } from './formatFile';
import { genManifest } from './manifest';
import { FileResult } from './type';
import { genSmartContractTypes } from './types';

export interface FilesResult {
  readonly abi: FileResult;
  readonly contract: FileResult;
  readonly types: FileResult;
}

export const genFiles = ({
  name,
  networksDefinition,
  sourceMapsPath,
  createContractPath,
  typesPath,
  manifestPath,
  manifest,
  browserify,
}: {
  readonly name: string;
  readonly networksDefinition: SmartContractNetworksDefinition;
  readonly sourceMapsPath: string;
  readonly createContractPath: string;
  readonly typesPath: string;
  readonly manifestPath: string;
  readonly contractPath: string;
  readonly manifest: ContractManifestClient;
  readonly browserify: boolean;
}) => {
  const manifestFile = formatFile(genManifest(name, manifest), browserify);
  const contractFile = formatFile(
    genContract({
      name,
      createContractPath,
      sourceMapsPath,
      typesPath,
      manifestPath,
      networksDefinition,
    }),
    browserify,
  );
  const typesFile = formatFile(genSmartContractTypes(name, manifest), browserify);

  return {
    manifest: manifestFile,
    contract: contractFile,
    types: typesFile,
  };
};
