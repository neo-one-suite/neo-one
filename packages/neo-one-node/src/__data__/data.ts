import { BlockJSON, common, crypto, JSONHelper, toWitnessScope, WitnessScopeModel } from '@neo-one/client-common';
import { Block, ConsensusData, Signer, Transaction, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { debugBlockJSON, genesisJSON, secondBlockJSON, thirdBlockJSON } from './jsonBlocks';

const convertBlock = (json: BlockJSON, messageMagic: number) =>
  new Block({
    version: json.version,
    previousHash: JSONHelper.readUInt256(json.previousblockhash),
    timestamp: new BN(json.time),
    index: json.index,
    nextConsensus: crypto.addressToScriptHash({
      addressVersion: common.NEO_ADDRESS_VERSION,
      address: json.nextconsensus,
    }),
    merkleRoot: JSONHelper.readUInt256(json.merkleroot),
    witness: new Witness({
      invocation: JSONHelper.readBase64Buffer(json.witnesses[0].invocation),
      verification: JSONHelper.readBase64Buffer(json.witnesses[0].verification),
    }),
    transactions: json.tx.map(
      (tx) =>
        new Transaction({
          hash: JSONHelper.readUInt256(tx.hash),
          nonce: tx.nonce,
          attributes: [],
          script: JSONHelper.readBase64Buffer(tx.script),
          systemFee: JSONHelper.readUInt64LE(tx.sysfee),
          networkFee: JSONHelper.readUInt64LE(tx.netfee),
          validUntilBlock: tx.validuntilblock,
          witnesses: tx.witnesses.map(
            (witness) =>
              new Witness({
                invocation: JSONHelper.readBase64Buffer(witness.invocation),
                verification: JSONHelper.readBase64Buffer(witness.verification),
              }),
          ),
          version: tx.version,
          signers: tx.signers.map(
            (signer) =>
              new Signer({
                account: JSONHelper.readUInt160(signer.account),
                scopes: (signer.scopes as any) === 'FeeOnly' ? WitnessScopeModel.None : toWitnessScope(signer.scopes),
              }),
          ),
          messageMagic,
        }),
    ),
    consensusData: json.consensusdata
      ? new ConsensusData({
          primaryIndex: json.consensusdata.primary,
          nonce: new BN(json.consensusdata.nonce, 16),
        })
      : undefined,
    messageMagic,
  });

export const getData = (messageMagic: number) => ({
  genesisBlock: convertBlock(genesisJSON as any, messageMagic),
  secondBlock: convertBlock(secondBlockJSON as any, messageMagic),
  thirdBlock: convertBlock(thirdBlockJSON as any, messageMagic),
  debugBlock: convertBlock(debugBlockJSON as any, messageMagic),
});
