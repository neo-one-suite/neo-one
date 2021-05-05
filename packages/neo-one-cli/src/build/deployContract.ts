import { Configuration, deployContract as deployContractBase, getClients } from '@neo-one/cli-common';
import {
  assertCallFlags,
  common,
  crypto,
  MethodTokenModel,
  NefFileModel,
  scriptHashToAddress,
  SignerModel,
  SourceMaps,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import { compileContract, LinkedContracts } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import { DiagnosticCategory } from 'typescript';
import { getPrimaryKeys } from '../common';

export const deployContract = async (
  config: Configuration,
  filePath: string,
  name: string,
  linked: LinkedContracts,
  sourceMaps: SourceMaps,
) => {
  const contract = await compileContract(filePath, name, createCompilerHost(), linked);
  if (contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)) {
    throw new Error('Compilation error.');
  }

  const masterPrivateKey = common.privateKeyToString(getPrimaryKeys().privateKey);
  const rpcURL = `http://localhost:${config.network.port}/rpc`;
  const provider = new NEOONEDataProvider({ network: 'local', rpcURL });
  const { masterWallet } = await getClients(provider, masterPrivateKey);
  const signerAddress = masterWallet.userAccount.id.address;

  const contractRegister = contract.contract;
  const signer = new SignerModel({
    account: crypto.addressToScriptHash({
      address: signerAddress,
      addressVersion: common.NEO_ADDRESS_VERSION,
    }),
    scopes: WitnessScopeModel.Global,
  });

  const nefFile = new NefFileModel({
    compiler: contractRegister.nefFile.compiler,
    script: Buffer.from(contractRegister.nefFile.script, 'hex'),
    tokens: contractRegister.nefFile.tokens.map(
      (token) =>
        new MethodTokenModel({
          hash: common.stringToUInt160(token.hash),
          method: token.method,
          paramCount: token.paramCount,
          hasReturnValue: token.hasReturnValue,
          callFlags: assertCallFlags(token.callFlags),
        }),
    ),
  });

  // TODO: create function for getting contract address from register/signer?
  const contractHash = crypto.getContractHash(signer.account, nefFile.checkSum, contractRegister.manifest.name);
  const address = scriptHashToAddress(common.uInt160ToString(contractHash));

  const sourceMap = await contract.sourceMap;
  const nextSourceMaps = {
    ...sourceMaps,
    [address]: sourceMap,
  };

  await deployContractBase(
    provider,
    contract.contract,
    contractHash,
    contract.contract.manifest,
    nextSourceMaps,
    masterPrivateKey,
  );

  return {
    manifest: contract.contract.manifest,
    address,
    sourceMap,
    sourceMaps: nextSourceMaps,
    linked: {
      ...linked,
      [filePath]: {
        [name]: address,
      },
    },
  };
};
