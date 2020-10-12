import { BlockJSON, common, crypto, JSONHelper, toWitnessScope, WitnessScopeModel } from '@neo-one/client-common';
import { Block, ConsensusData, Signer, Transaction, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { genesisJSON, secondBlockJSON, thirdBlockJSON } from './jsonBlocks';

const convertBlock = (json: BlockJSON) =>
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
      invocation: Buffer.from(json.witnesses[0].invocation, 'base64'),
      verification: Buffer.from(json.witnesses[0].verification, 'base64'),
    }),
    transactions: json.tx.map(
      (tx) =>
        new Transaction({
          hash: JSONHelper.readUInt256(tx.hash),
          nonce: tx.nonce,
          attributes: [],
          script: Buffer.from(tx.script, 'base64'),
          systemFee: new BN(tx.sysfee),
          networkFee: new BN(tx.netfee),
          validUntilBlock: tx.validuntilblock,
          witnesses: tx.witnesses.map(
            (witness) =>
              new Witness({
                invocation: Buffer.from(witness.invocation, 'base64'),
                verification: Buffer.from(witness.verification, 'base64'),
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
        }),
    ),
    consensusData: json.consensusdata
      ? new ConsensusData({
          primaryIndex: json.consensusdata.primary,
          nonce: new BN(json.consensusdata.nonce, 16),
        })
      : undefined,
  });

const genesisBlockFromJSON = convertBlock(genesisJSON as any);
const secondBlockFromJSON = convertBlock(secondBlockJSON as any);
const thirdBlockFromJSON = convertBlock(thirdBlockJSON as any);

export const data = {
  genesisBlock: genesisBlockFromJSON,
  secondBlock: secondBlockFromJSON,
  thirdBlock: thirdBlockFromJSON,
};
