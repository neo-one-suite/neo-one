import { BN } from 'bn.js';
import { keys } from '../../../__data__/keys';
import { BinaryWriter } from '../../../BinaryWriter';
import { SignerModel, TransactionModel, TransactionModelAdd } from '../../../models';

const testSender = keys[0].scriptHash;
const testPrivKey = keys[1].privateKey;

const optionsBuilder = ({
  version = 0,
  nonce = 0,
  systemFee = new BN(0),
  networkFee = new BN(0),
  validUntilBlock = 100000,
  sender = testSender,
  attributes = [],
  witnesses = [],
  signers = [],
  hash,
  script = Buffer.from([0x10]),
}: Partial<TransactionModelAdd>): TransactionModelAdd => ({
  version,
  nonce,
  systemFee,
  networkFee,
  validUntilBlock,
  sender,
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

describe('Transaction Model', () => {
  beforeEach(resetWriter);

  const systemFee = new BN(1);
  const networkFee = new BN(1);
  const script = Buffer.from([0x01]);

  test('Serialize Base - Unsigned', () => {
    const transaction = new TransactionModel({ ...optionsBuilder({ systemFee, networkFee, script }) });
    transaction.serializeUnsignedBase(testWriter);
    expect(testWriter.toBuffer()).toMatchSnapshot();
  });

  test('Serialize Base - With Cosigners', () => {
    const signer = new SignerModel({
      account: testSender,
      scopes: 'Global',
    });

    const cosignerTransaction = new TransactionModel({
      ...optionsBuilder({
        systemFee,
        networkFee,
        script,
        signers: [signer],
      }),
    });

    const serializeUnsigned = cosignerTransaction.serializeUnsigned();
    expect(serializeUnsigned).toBeDefined();
  });

  test('Cloned Transaction', () => {
    const transaction = new TransactionModel({ ...optionsBuilder({ systemFee, networkFee, script }) });
    const clonedTransaction = transaction.clone();

    expect(JSON.stringify(transaction)).toEqual(JSON.stringify(clonedTransaction));
  });

  test('Serialize Base - Signed', () => {
    const transaction = new TransactionModel({ ...optionsBuilder({ systemFee, networkFee, script }) });
    const signedTransaction = transaction.sign(testPrivKey);
    const witness = signedTransaction.witnesses[0];
    expect(witness).toBeDefined();
    const serializedUnsigned = signedTransaction.serializeUnsigned();
    const serializedSigned = signedTransaction.serializeWire();
    expect(serializedSigned).toEqual(Buffer.concat([serializedUnsigned, Buffer.from([0x01]), witness.serializeWire()]));
  });
});
