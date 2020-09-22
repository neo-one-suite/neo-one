import { common as clientCommon, crypto, UInt160 } from '@neo-one/client-common';
import { Settings, TransactionType } from '@neo-one/node-core';
import { common } from './common';

const DEFAULT_VALIDATORS: readonly string[] = [
  '0327da12b5c40200e9f65569476bbff2218da4f32548ff43b6387ec1416a231ee8',
  '026ce35b29147ad09e4afe4ec4a7319095f08198fa8babbe3c56e970b143528d22',
  '0209e7fd41dfb5c2f8dc72eb30358ac100ea8c72da18847befe06eade68cebfcb9',
  '039dafd8571a641058ccc832c5e2111ea39b09c0bde36050914384f7a48bce9bf9',
  '038dddc06ce687677a53d54f096d2591ba2302068cf123c1f2d75c2dddc5425579',
  '02d02b1873a0863cd042cc717da31cea0d7cf9db32b74d4c72c01b0011503e2e22',
  '034ff5ceeac41acf22cd5ed2da17a6df4dd8358fcb2bfb1a43208ad0feaab2746b',
];

export const createTest = ({
  privateNet,
  standbyValidators: standbyValidatorsIn = DEFAULT_VALIDATORS,
  secondsPerBlock,
  address: addressIn,
}: {
  readonly privateNet?: boolean;
  readonly secondsPerBlock?: number;
  readonly standbyValidators?: readonly string[];
  readonly address?: string;
} = {}): Settings => {
  const standbyValidators = standbyValidatorsIn.map((value) => clientCommon.stringToECPoint(value));

  const consensusAddress =
    standbyValidatorsIn === DEFAULT_VALIDATORS
      ? clientCommon.asUInt160(Buffer.from('f3812db982f3b0089a21a278988efeec6a027b25', 'hex'))
      : crypto.getConsensusAddress(standbyValidators);
  let address: UInt160;
  if (addressIn === undefined) {
    address =
      standbyValidatorsIn === DEFAULT_VALIDATORS
        ? clientCommon.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex'))
        : crypto.toScriptHash(
            crypto.createMultiSignatureVerificationScript(standbyValidators.length / 2 + 1, standbyValidators),
          );
  } else {
    address = clientCommon.stringToUInt160(addressIn);
  }

  const commonSettings = common({
    privateNet,
    address,
    consensusAddress,
  });

  return {
    genesisBlock: commonSettings.genesisBlock,
    governingToken: commonSettings.governingToken,
    utilityToken: commonSettings.utilityToken,
    decrementInterval: commonSettings.decrementInterval,
    generationAmount: commonSettings.generationAmount,
    secondsPerBlock: secondsPerBlock === undefined ? commonSettings.secondsPerBlock : secondsPerBlock,
    maxTransactionsPerBlock: commonSettings.maxTransactionsPerBlock,
    memPoolSize: commonSettings.memPoolSize,
    getFreeGas: commonSettings.getFreeGas,
    fees: {
      [TransactionType.Enrollment]: clientCommon.fixed8FromDecimal(10),
      [TransactionType.Issue]: clientCommon.fixed8FromDecimal(5),
      [TransactionType.Publish]: clientCommon.fixed8FromDecimal(5),
      [TransactionType.Register]: clientCommon.fixed8FromDecimal(100),
    },

    registerValidatorFee: clientCommon.fixed8FromDecimal(1000),
    messageMagic: 1953787457,
    addressVersion: clientCommon.NEO_ADDRESS_VERSION,
    privateKeyVersion: clientCommon.NEO_PRIVATE_KEY_VERSION,
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
