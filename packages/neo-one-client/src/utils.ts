import { common, ScriptBuilder, ScriptBuilderParam } from '@neo-one/client-core';
import { addressToScriptHash } from './helpers';
import { AddressString } from './types';

export const getInvokeMethodInvocationScript = ({
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

export const getInvokeMethodScript = ({
  address,
  method,
  params,
}: {
  readonly address: AddressString;
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCall(common.stringToUInt160(addressToScriptHash(address)), method, ...params);

  return sb.build();
};
