import { ContractGroup, ContractManifestClient, ContractPermission, WildcardContainer } from '@neo-one/client-common';
import { RawSourceMap } from 'source-map';

export interface Contract {
  readonly name: string;
  readonly trusts: WildcardContainer<string>;
  readonly permissions: readonly ContractPermission[];
  readonly groups: readonly ContractGroup[];
}

export interface TranspileResult {
  readonly sourceFiles: {
    readonly [filePath: string]: {
      readonly text: string;
      readonly sourceMap: RawSourceMap;
    };
  };
  readonly manifest: ContractManifestClient;
  readonly contract: Contract;
}
