/* @flow */
import {
  ASSET_TYPE,
  Asset,
  ScriptBuilder,
  common,
  crypto,
} from '@neo-one/client-core';

const ONE_HUNDRED_MILLION = common.fixed8FromDecimal(100000000);

const neoAdmin = crypto.toScriptHash(
  new ScriptBuilder().emitOp('PUSH1').build(),
);

export const NEO_ASSET_HASH_UINT256 = common.stringToUInt256(
  common.NEO_ASSET_HASH,
);
export const NEO_ASSET = new Asset({
  hash: NEO_ASSET_HASH_UINT256,
  type: ASSET_TYPE.GOVERNING_TOKEN,
  name: '[{"lang":"zh-CN","name":"小蚁股"},{"lang":"en","name":"AntShare"}]',
  amount: ONE_HUNDRED_MILLION,
  precision: 0,
  owner: common.ECPOINT_INFINITY,
  admin: neoAdmin,
  issuer: neoAdmin,
  expiration: 2 * 2000000,
  isFrozen: false,
});

const gasAdmin = crypto.toScriptHash(
  new ScriptBuilder().emitOp('PUSH0').build(),
);

export const GAS_ASSET_HASH_UINT256 = common.stringToUInt256(
  common.GAS_ASSET_HASH,
);
export const GAS_ASSET = new Asset({
  hash: GAS_ASSET_HASH_UINT256,
  type: ASSET_TYPE.UTILITY_TOKEN,
  name: '[{"lang":"zh-CN","name":"小蚁币"},{"lang":"en","name":"AntCoin"}]',
  amount: ONE_HUNDRED_MILLION,
  precision: 8,
  owner: common.ECPOINT_INFINITY,
  admin: gasAdmin,
  issuer: gasAdmin,
  expiration: 2 * 2000000,
  isFrozen: false,
});

const assets = {
  [common.NEO_ASSET_HASH]: NEO_ASSET,
  [common.GAS_ASSET_HASH]: GAS_ASSET,
};

export const createGetAsset = (): $FlowFixMe =>
  jest.fn(({ hash }) => {
    const asset = assets[common.uInt256ToString(hash)];
    if (asset == null) {
      throw new Error(`Unknown asset ${common.uInt256ToString(hash)}`);
    }

    return asset;
  });
