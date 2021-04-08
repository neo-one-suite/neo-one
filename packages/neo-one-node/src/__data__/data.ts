import { BlockJSON, common, crypto, JSONHelper, toWitnessScope, WitnessScopeModel } from '@neo-one/client-common';
import { Block, Header, Signer, Transaction, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { genesisJSON, secondBlockJSON, thirdBlockJSON } from './jsonBlocks';

const convertBlock = (json: BlockJSON, messageMagic: number) =>
  new Block({
    header: new Header({
      previousHash: JSONHelper.readUInt256(json.previousblockhash),
      timestamp: new BN(json.time),
      index: json.index,
      primaryIndex: json.primary,
      nextConsensus: crypto.addressToScriptHash({
        addressVersion: common.NEO_ADDRESS_VERSION,
        address: json.nextconsensus,
      }),
      merkleRoot: JSONHelper.readUInt256(json.merkleroot),
      witness: new Witness({
        invocation: JSONHelper.readBase64Buffer(json.witnesses[0].invocation),
        verification: JSONHelper.readBase64Buffer(json.witnesses[0].verification),
      }),
      messageMagic,
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
                // tslint:disable-next-line: no-any
                scopes: (signer.scopes as any) === 'FeeOnly' ? WitnessScopeModel.None : toWitnessScope(signer.scopes),
              }),
          ),
          messageMagic,
        }),
    ),
  });

// tslint:disable no-any export-name
export const getData = (messageMagic: number) => ({
  genesisBlock: convertBlock(genesisJSON as any, messageMagic),
  secondBlock: convertBlock(secondBlockJSON as any, messageMagic),
  thirdBlock: convertBlock(thirdBlockJSON as any, messageMagic),
});
