/* @flow */
import {
  ASSET_TYPE,
  RegisterTransaction,
  ScriptBuilder,
  common,
  crypto,
} from '@neo-one/client-core';

const scriptBuilder = new ScriptBuilder();
scriptBuilder.emitOp('PUSH1');
const admin = crypto.toScriptHash(scriptBuilder.build());
const register = new RegisterTransaction({
  asset: {
    type: ASSET_TYPE.GOVERNING_TOKEN,
    name: '[{"lang":"zh-CN","name":"小蚁股"},{"lang":"en","name":"AntShare"}]',
    amount: common.fixed8FromDecimal(100000000),
    precision: 0,
    owner: common.ECPOINT_INFINITY,
    admin,
  },
});

export default {
  register,
};
