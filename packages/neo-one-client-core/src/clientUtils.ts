import {
  AddressString,
  addressToScriptHash,
  BufferString,
  common,
  NetworkType,
  ScriptBuilder,
  ScriptBuilderParam,
  UInt160Hex,
} from '@neo-one/client-common';
import sp from 'synchronized-promise';
import { LocalKeyStore } from './user';

const getInvokeMethodInvocationScript = ({
  method,
  params,
}: {
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCallInvocation(method, ...params);

  return sb.build();
};

const getInvokeMethodScript = ({
  scriptHash,
  method,
  params,
}: {
  readonly scriptHash: UInt160Hex;
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCall(common.stringToUInt160(scriptHash), method, ...params);

  return sb.build();
};

export const addLocalKeysSync = (
  wallets: ReadonlyArray<{
    readonly network: NetworkType;
    readonly privateKey?: BufferString;
    readonly name?: string;
    readonly password?: string;
    readonly nep2?: string;
  }>,
  keyStore: LocalKeyStore,
) => sp(async () => Promise.all(wallets.map((wallet) => keyStore.addUserAccount(wallet))))();

export const clientUtils = {
  getInvokeMethodInvocationScript,
  getInvokeMethodScript,
};
