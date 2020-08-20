import { Block } from '../Block';
import { Witness } from '../Witness';
import { common } from '@neo-one/client-common';

const tx = new Transaction({
  script: Buffer.from([0x01]),
  attributes: [],
  signers: [],
  networkFee: 0x02,
  systemFee: 0x03,
  nonce: 0x04,
  validUntilBlock: 0x05,
  version: 0x06,
  witness: new Witness({ verification: Buffer.from([0x07]), invocation: Buffer.from([]) }),
});

const block = new Block({
  index: 0,
  timestamp: 2,
  version: 3,
  witness: new Witness({
    invocation: Buffer.from([]),
    verification: Buffer.from([]),
  }),
  previousHash: common.ZERO_UINT256,
  merkleRoot: common.ZERO_UINT256,
  nextConsensus: common.ZERO_UINT160,
  consensusData: new ConsensusData({
    nonce: 1,
    primaryIndex: 1,
  }),
  transactions: [tx],
});
