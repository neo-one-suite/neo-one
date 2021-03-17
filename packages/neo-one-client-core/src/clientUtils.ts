import { common, ScriptBuilder, ScriptBuilderParam, UInt160Hex } from '@neo-one/client-common';

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
  sb.emitDynamicAppCall(common.stringToUInt160(scriptHash), method, ...params);

  return sb.build();
};

export const clientUtils = {
  getInvokeMethodInvocationScript,
  getInvokeMethodScript,
};
