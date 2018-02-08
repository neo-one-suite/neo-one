/* @flow */
import { TRANSACTION_TYPE, type Settings, common } from '@neo-one/client-core';

import createCommon from './common';

export default (options?: {|
  privateNet?: boolean,
  secondsPerBlock?: number,
  standbyValidators?: Array<string>,
  address?: string,
|}): Settings => {
  const {
    privateNet,
    secondsPerBlock,
    standbyValidators: standbyValidatorsIn,
    address,
  } =
    options || {};
  const standbyValidators = (
    standbyValidatorsIn || [
      '0327da12b5c40200e9f65569476bbff2218da4f32548ff43b6387ec1416a231ee8',
      '026ce35b29147ad09e4afe4ec4a7319095f08198fa8babbe3c56e970b143528d22',
      '0209e7fd41dfb5c2f8dc72eb30358ac100ea8c72da18847befe06eade68cebfcb9',
      '039dafd8571a641058ccc832c5e2111ea39b09c0bde36050914384f7a48bce9bf9',
      '038dddc06ce687677a53d54f096d2591ba2302068cf123c1f2d75c2dddc5425579',
      '02d02b1873a0863cd042cc717da31cea0d7cf9db32b74d4c72c01b0011503e2e22',
      '034ff5ceeac41acf22cd5ed2da17a6df4dd8358fcb2bfb1a43208ad0feaab2746b',
    ]
  ).map(value => common.stringToECPoint(value));
  const commonSettings = createCommon({
    privateNet,
    standbyValidators,
    address: address == null ? undefined : common.stringToUInt160(address),
  });
  return {
    genesisBlock: commonSettings.genesisBlock,
    governingToken: commonSettings.governingToken,
    utilityToken: commonSettings.utilityToken,
    decrementInterval: commonSettings.decrementInterval,
    generationAmount: commonSettings.generationAmount,
    secondsPerBlock:
      secondsPerBlock == null
        ? commonSettings.secondsPerBlock
        : secondsPerBlock,
    maxTransactionsPerBlock: commonSettings.maxTransactionsPerBlock,
    fees: {
      [TRANSACTION_TYPE.ENROLLMENT]: common.fixed8FromDecimal(10),
      [TRANSACTION_TYPE.ISSUE]: common.fixed8FromDecimal(5),
      [TRANSACTION_TYPE.PUBLISH]: common.fixed8FromDecimal(5),
      [TRANSACTION_TYPE.REGISTER]: common.fixed8FromDecimal(100),
    },
    registerValidatorFee: common.fixed8FromDecimal(1000),
    messageMagic: 1953787457,
    addressVersion: common.NEO_ADDRESS_VERSION,
    privateKeyVersion: common.NEO_PRIVATE_KEY_VERSION,
    standbyValidators,
    vm: {
      storageContext: {
        v0: {
          index: 163594,
        },
      },
    },
  };
};
