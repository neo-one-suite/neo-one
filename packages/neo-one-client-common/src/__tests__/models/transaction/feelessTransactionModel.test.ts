import { BN } from 'bn.js';
import { keys } from '../../../__data__/keys';
import { BinaryWriter } from '../../../BinaryWriter';
import { common } from '../../../common';
import {
  FeelessTransactionModel,
  FeelessTransactionModelAdd,
  SignerModel,
  transactionHelper,
  WitnessScopeModel,
} from '../../../models';

const testSender = keys[0].scriptHash;

const optionsBuilder = ({
  version = 0,
  nonce = 0,
  validUntilBlock = 100000,
  attributes = [],
  witnesses = [],
  signers = [new SignerModel({ account: testSender, scopes: WitnessScopeModel.None })],
  hash,
  script = Buffer.from([0x10]),
}: Partial<FeelessTransactionModelAdd>): FeelessTransactionModelAdd => ({
  version,
  nonce,
  validUntilBlock,
  attributes,
  witnesses,
  signers,
  hash,
  script,
});

// tslint:disable-next-line:no-let
let testWriter: BinaryWriter = new BinaryWriter();
const resetWriter = () => {
  testWriter = new BinaryWriter();
};

describe('Feeless Transaction Model', () => {
  beforeEach(resetWriter);
  const script = Buffer.from([0x01]);

  test('Serialize Base - Unsigned', () => {
    const transaction = new FeelessTransactionModel({ ...optionsBuilder({ script }) });
    transaction.serializeUnsignedBase(testWriter);
    expect(testWriter.toBuffer()).toMatchSnapshot();
  });

  test('Serialize Base - With Cosigners', () => {
    const signer = new SignerModel({
      account: testSender,
      scopes: WitnessScopeModel.Global,
    });

    const cosignerTransaction = new FeelessTransactionModel({
      ...optionsBuilder({
        script,
        signers: [signer],
      }),
    });

    const serializeUnsigned = cosignerTransaction.serializeUnsigned();
    expect(serializeUnsigned).toBeDefined();
  });

  test('Cloned with fee', () => {
    const feelessTransaction = new FeelessTransactionModel({ ...optionsBuilder({ script }) });
    const fullTransaction = transactionHelper.addFees(feelessTransaction, {
      systemFee: new BN(1),
      networkFee: new BN(2),
    });

    console.log(feelessTransaction.hashHex);
    console.log(fullTransaction.hashHex);
    expect(feelessTransaction.hash).not.toEqual(fullTransaction.hash);
  });
});
