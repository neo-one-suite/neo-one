import {
  AccountContract,
  common,
  ContractParameterTypeModel,
  crypto,
  ECPoint,
  PrivateKey,
  UInt160,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ContractParametersContext } from '../ContractParametersContext';
import { Signer } from '../Signer';
import { Transaction } from '../transaction';
import { Witness } from '../Witness';

const getTransaction = (sender: UInt160) =>
  new Transaction({
    script: Buffer.from([0x00]),
    attributes: [],
    signers: [
      new Signer({
        account: sender,
        scopes: WitnessScopeModel.CalledByEntry,
      }),
    ],
    witnesses: [
      new Witness({
        invocation: Buffer.from([]),
        verification: Buffer.from([]),
      }),
    ],
    networkFee: new BN(0),
    systemFee: new BN(0),
    validUntilBlock: 2000,
    messageMagic: 73450591,
  });

describe('ContractParametersContext Test', () => {
  let privateKey: PrivateKey;
  let publicKey: ECPoint;
  let contract: AccountContract;
  beforeEach(() => {
    // tslint:disable-next-line: prefer-array-literal
    privateKey = common.asPrivateKey(Buffer.from(new Array(32).fill(0x01)));
    publicKey = crypto.privateKeyToPublicKey(privateKey);
    contract = AccountContract.createSignatureContract(publicKey);
  });

  test('addWithIndex', () => {
    const context = new ContractParametersContext([common.ZERO_UINT160]);
    const testContract = new AccountContract({
      script: Buffer.from([0x00]),
      parameterList: [0x10],
      scriptHash: common.ZERO_UINT160,
    });

    const beforeItems = context.contextItems;

    context.addWithIndex(testContract, 0, false);
    const afterItems = context.contextItems;

    expect(Object.values(beforeItems).length).toEqual(0);
    expect(Object.values(afterItems).length).toEqual(1);
  });

  test('add', () => {
    const context = new ContractParametersContext([common.ZERO_UINT160]);
    const testContract = new AccountContract({
      script: Buffer.from([0x00]),
      parameterList: [0x10],
      scriptHash: common.ZERO_UINT160,
    });

    const beforeItems = context.contextItems;

    context.add(testContract, [false]);
    const afterItems = context.contextItems;

    expect(Object.values(beforeItems).length).toEqual(0);
    expect(Object.values(afterItems).length).toEqual(1);
  });

  test('addSignature -- true', () => {
    const singleSender = common.hexToUInt160('0x282646ee0afa5508bb999318f35074b84a17c9f0');
    const tx = getTransaction(singleSender);

    const context = new ContractParametersContext(tx.getScriptHashesForVerifying());
    const result = context.addSignature(contract, publicKey, Buffer.from([0x01]));

    expect(result).toEqual(true);
    expect(context.getWitnesses().length).toEqual(1);
  });

  test('addSignature -- false', () => {
    const singleSender = common.hexToUInt160('0x282646ee0afa5508bb999318f35074b84a17c9f0');
    const tx = getTransaction(singleSender);

    const newContract = {
      ...contract,
      parameterList: [],
      scriptHash: contract.scriptHash,
      address: contract.address,
    };

    const context = new ContractParametersContext(tx.getScriptHashesForVerifying());
    const result = context.addSignature(newContract, publicKey, Buffer.from([0x01]));

    expect(result).toEqual(false);
  });

  test('addSignature -- throws', () => {
    const singleSender = common.hexToUInt160('0x282646ee0afa5508bb999318f35074b84a17c9f0');
    const tx = getTransaction(singleSender);

    const newContract = {
      ...contract,
      parameterList: [ContractParameterTypeModel.Signature, ContractParameterTypeModel.Signature],
      scriptHash: contract.scriptHash,
      address: contract.address,
    };

    const context = new ContractParametersContext(tx.getScriptHashesForVerifying());
    const throwFunc = () => context.addSignature(newContract, publicKey, Buffer.from([0x01]));
    expect(throwFunc).toThrow();
  });
});
