import { AddressString, addressToScriptHash, common, ScriptBuilder, ScriptBuilderParam } from '@neo-one/client-common';

const getInvokeMethodInvocationScript = ({
  method,
  params,
}: {
  readonly method: string;
  readonly params: readonly (ScriptBuilderParam | undefined)[];
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCallInvocation(method, ...params);

  return sb.build();
};

const getInvokeMethodScript = ({
  address,
  method,
  params,
}: {
  readonly address: AddressString;
  readonly method: string;
  readonly params: readonly (ScriptBuilderParam | undefined)[];
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCall(common.stringToUInt160(addressToScriptHash(address)), method, ...params);

  return sb.build();
};

export const clientUtils = {
  getInvokeMethodInvocationScript,
  getInvokeMethodScript,
};
