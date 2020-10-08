import { common, crypto, toWitnessScope, WitnessScopeJSON, WitnessScopeModel } from '@neo-one/client-common';
import { Block, ConsensusData, Signer, Transaction, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';

const a = {
  hash: '0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45',
  size: 172,
  version: 0,
  previousblockhash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  merkleroot: '0x948aad0908a742eec79c52a0a4d5f95b1683a9adc3c2700211f425d49693878d',
  time: 1468595301000,
  index: 0,
  nextconsensus: 'NgPkjjLTNcQad99iRYeXRUuowE4gxLAnDL',
  witnesses: [
    {
      invocation: '',
      verification: 'EQ==',
    },
  ],
  consensusdata: {
    primary: 0,
    nonce: '000000007c2bac1d',
  },
  tx: [
    {
      hash: '0x173dcbc4a88995a0cf7bdd006923d148f787f76ca75621dc4c440ca6d9afbc73',
      size: 58,
      version: 0,
      nonce: 0,
      sender: 'NeN4xPMn4kHoj7G8Lciq9oorgLTvqt4qi1',
      sysfee: '0',
      netfee: '0',
      validuntilblock: 0,
      signers: [
        {
          account: '0xa7213b15cc18d19c810f644e37411d882ee561ca',
          scopes: 'FeeOnly',
        },
      ],
      attributes: [],
      script: 'QRI+f+g=',
      witnesses: [
        {
          invocation: '',
          verification: 'EQ==',
        },
      ],
    },
  ],
  confirmations: 291297,
  nextblockhash: '0x8f30c34a8a8ef997155aa4a0ef6664d872a127ecc3bb6a85b7bbc55d6d9912f5',
};

const b = {
  hash: '0x8f30c34a8a8ef997155aa4a0ef6664d872a127ecc3bb6a85b7bbc55d6d9912f5',
  size: 700,
  version: 0,
  previousblockhash: '0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45',
  merkleroot: '0x9ff5ba403c81151c0d031b548fe6cff82ef61a01be72c38ecc81d4bc2f1ee01c',
  time: 1596537327793,
  index: 1,
  nextconsensus: 'NgPkjjLTNcQad99iRYeXRUuowE4gxLAnDL',
  witnesses: [
    {
      invocation:
        'DED/2tpnw4uN5407xKQuwAXw+Hm9L4P51hSMfjwbEcm7pN+aFdn5+d/VxT9ifDX0KQRGlbericqr6h2gQvnJYvHqDECO9w/7PAccs3K3yqAZ4zDTpsnxxDU5EyR1PNNcBUx31lFGyHtjcxhce+YNYxcJc2zOFFk+lFmCBn+ZiF1HZrkPDEBbpwRGODeexXqSws2VQPrOg/BiCNYKmAj3vPW8HvC3ypnly/Hfy8lYF9iZiIighzUALC4QzQpxdq1IdNMSH22jDEAe/l0FF8HXc6e20zT6x0D8XvrITHsKMxxe4S5hGYwojgBDjJPcMwvJbT83AF+sorbZc7SMaCGwT1XOEg+9M0G2DEDOK/OsvMqyKgyHf/gz5QFgQxPjHKuuMoN38+OLuMRP36K4Eunv7oql3KstrgpVIqZHtETEHmxMEFIFXu5hFEa8',
      verification:
        'FQwhAwCbdUDhDyVi5f2PrJ6uwlFmpYsm5BI0j/WoaSe/rCKiDCEDAgXpzvrqWh38WAryDI1aokaLsBSPGl5GBfxiLIDmBLoMIQIUuvDO6jpm8X5+HoOeol/YvtbNgua7bmglAYkGX0T/AQwhAj6bMuqJuU0GbmSbEk/VDjlu6RNp6OKmrhsRwXDQIiVtDCEDQI3NQWOW9keDrFh+oeFZPFfZ/qiAyKahkg6SollHeAYMIQKng0vpsy4pgdFXy1u9OstCz9EepcOxAiTXpE6YxZEPGwwhAroscPWZbzV6QxmHBYWfriz+oT4RcpYoAHcrPViKnUq9FwtBE43vrw==',
    },
  ],
  consensusdata: {
    primary: 1,
    nonce: 'f490dfe92971e572',
  },
  tx: [] as typeof a.tx,
  confirmations: 294767,
  nextblockhash: '0x84fa4b26af4b00095d66714a3a2ec63acdeff7ae27ca5d4f6cbe5db2691d7fae',
};

const rpcDataToSerialize = {
  version: 0,
  previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '0x948aad0908a742eec79c52a0a4d5f95b1683a9adc3c2700211f425d49693878d',
  timestamp: 1468595301000,
  index: 0,
  nextConsensus: 'NgPkjjLTNcQad99iRYeXRUuowE4gxLAnDL',
};

const ourGenesisDataToSerialize = {
  version: 0, // good
  previousHash: Buffer.alloc(32, 0), // probably good
  merkleRoot: '', // need to check
  timestamp: new BN(Date.UTC(2016, 6, 15, 15, 8, 21)), // good
  index: 0, // good
  nextConsensus: '', // need to check
};

const firstBlock = new Block({
  version: a.version,
  previousHash: common.stringToUInt256(a.previousblockhash),
  timestamp: new BN(a.time),
  index: a.index,
  nextConsensus: crypto.addressToScriptHash({ addressVersion: common.NEO_ADDRESS_VERSION, address: a.nextconsensus }),
  merkleRoot: common.stringToUInt256(a.merkleroot),
  consensusData: new ConsensusData({ primaryIndex: a.consensusdata.primary, nonce: new BN(a.consensusdata.nonce, 16) }),
  witness: new Witness({
    invocation: Buffer.from(a.witnesses[0].invocation, 'base64'),
    verification: Buffer.from(a.witnesses[0].verification, 'base64'),
  }),
  transactions: a.tx.map(
    (tx) =>
      new Transaction({
        hash: common.stringToUInt256(tx.hash),
        nonce: tx.nonce,
        attributes: tx.attributes,
        script: Buffer.from(tx.script, 'base64'),
        systemFee: new BN(tx.sysfee),
        networkFee: new BN(tx.netfee),
        validUntilBlock: tx.validuntilblock,
        witnesses: tx.witnesses.map(
          (t) =>
            new Witness({
              invocation: Buffer.from(t.invocation, 'base64'),
              verification: Buffer.from(t.verification, 'base64'),
            }),
        ),
        version: tx.version,
        signers: tx.signers.map(
          (s) =>
            new Signer({
              account: common.stringToUInt160(s.account),
              scopes: s.scopes === 'FeeOnly' ? WitnessScopeModel.None : toWitnessScope(s.scopes as WitnessScopeJSON),
            }),
        ),
      }),
  ),
});

const secondBlock = new Block({
  version: b.version,
  previousHash: common.stringToUInt256(b.previousblockhash),
  timestamp: new BN(b.time),
  index: b.index,
  nextConsensus: crypto.addressToScriptHash({ addressVersion: common.NEO_ADDRESS_VERSION, address: b.nextconsensus }),
  // merkleRoot: common.stringToUInt256(b.merkleroot),
  consensusData: new ConsensusData({ primaryIndex: b.consensusdata.primary, nonce: new BN(b.consensusdata.nonce, 16) }),
  witness: new Witness({
    invocation: Buffer.from(b.witnesses[0].invocation, 'base64'),
    verification: Buffer.from(b.witnesses[0].verification, 'base64'),
  }),
  transactions: b.tx.map(
    (tx) =>
      new Transaction({
        hash: common.stringToUInt256(tx.hash),
        nonce: tx.nonce,
        attributes: tx.attributes,
        script: Buffer.from(tx.script, 'base64'),
        systemFee: new BN(tx.sysfee),
        networkFee: new BN(tx.netfee),
        validUntilBlock: tx.validuntilblock,
        witnesses: tx.witnesses.map(
          (t) =>
            new Witness({
              invocation: Buffer.from(t.invocation, 'base64'),
              verification: Buffer.from(t.verification, 'base64'),
            }),
        ),
        version: tx.version,
        signers: tx.signers.map(
          (s) =>
            new Signer({
              account: common.stringToUInt160(s.account),
              scopes: s.scopes === 'FeeOnly' ? WitnessScopeModel.None : toWitnessScope(s.scopes as WitnessScopeJSON),
            }),
        ),
      }),
  ),
});

export const data = {
  firstBlock,
  secondBlock,
};
