import { common as clientCommon, crypto, UInt160 } from '@neo-one/client-common';
import { Settings, TransactionType } from '@neo-one/node-core';
import { common } from './common';

const DEFAULT_VALIDATORS: readonly string[] = [
  '03b209fd4f53a7170ea4444e0cb0a6bb6a53c2bd016926989cf85f9b0fba17a70c',
  '02df48f60e8f3e01c48ff40b9b7f1310d7a8b2a193188befe1c2e3df740e895093',
  '03b8d9d5771d8f513aa0869b9cc8d50986403b78c6da36890638c3d46a5adce04a',
  '02ca0e27697b9c248f6f16e085fd0061e26f44da85b58ee835c110caa5ec3ba554',
  '024c7b7fb6c310fccf1ba33b082519d82964ea93868d676662d4a59ad548df0e7d',
  '02aaec38470f6aad0042c6e877cfd8087d2676b0f516fddd362801b9bd3936399e',
  '02486fd15702c4490a26703112a5cc1d0923fd697a33406bd5a1c00e0013b09a70',
];

export const createMain = ({
  privateNet = false,
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
      ? clientCommon.asUInt160(Buffer.from('59e75d652b5d3827bf04c165bbe9ef95cca4bf55', 'hex'))
      : crypto.getConsensusAddress(standbyValidators);
  let address: UInt160;
  if (addressIn === undefined) {
    address =
      standbyValidatorsIn === DEFAULT_VALIDATORS
        ? clientCommon.asUInt160(Buffer.from('5fa99d93303775fe50ca119c327759313eccfa1c', 'hex'))
        : crypto.toScriptHash(
            crypto.createMultiSignatureVerificationScript(standbyValidators.length / 2 + 1, standbyValidators),
          );
  } else {
    address = clientCommon.stringToUInt160(addressIn);
  }

  const commonSettings = common({
    privateNet,
    consensusAddress,
    address,
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
    fees: {
      [TransactionType.Enrollment]: clientCommon.fixed8FromDecimal(1000),
      [TransactionType.Issue]: clientCommon.fixed8FromDecimal(500),
      [TransactionType.Publish]: clientCommon.fixed8FromDecimal(500),
      [TransactionType.Register]: clientCommon.fixed8FromDecimal(10000),
    },

    registerValidatorFee: clientCommon.fixed8FromDecimal(1000),
    messageMagic: 7630401,
    addressVersion: clientCommon.NEO_ADDRESS_VERSION,
    privateKeyVersion: clientCommon.NEO_PRIVATE_KEY_VERSION,
    standbyValidators,
    vm: {
      storageContext: {
        v0: {
          index: 0,
        },
      },
    },
  };
};
