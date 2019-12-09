import { BN } from 'bn.js';
import { keys } from '../../../__data__/keys';
import { BinaryWriter } from '../../../BinaryWriter';
import { CosignerModel, TransactionModel, TransactionModelAdd } from '../../../models';

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
  cosigners = [],
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
  cosigners,
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
    const cosigner = new CosignerModel({
      account: testSender,
      scopes: 'Global',
    });

    const cosignerTransaction = new TransactionModel({
      ...optionsBuilder({
        systemFee,
        networkFee,
        script,
        cosigners: [cosigner],
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

// describe('Output Model', () => {
//   beforeEach(resetWriter);

//   const options = {
//     asset: common.ZERO_UINT256,
//     value: new BN(1),
//     address: common.ZERO_UINT160,
//   };

//   const outputModel = new OutputModel(options);

//   test('Serialize Wire Base', () => {
//     outputModel.serializeWireBase(testWriter);
//     expect(testWriter.toBuffer()).toEqual(
//       Buffer.concat([
//         common.uInt256ToBuffer(options.asset),
//         Buffer.from(options.value.toTwos(8 * 8).toArrayLike(Buffer, 'le', 8)),
//         Buffer.from(options.address),
//       ]),
//     );
//   });

//   test('Clone Model', () => {
//     const clonedModel = outputModel.clone({});
//     expect(clonedModel.address).toEqual(outputModel.address);
//     expect(clonedModel.asset).toEqual(outputModel.asset);
//   });
// });

// describe('Transaction Type Model', () => {
//   test('Assert Transaction Type', () => {
//     const goodByte = 0x00;

//     expect(assertTransactionType(goodByte)).toEqual(goodByte);
//   });

//   test('Assert Transaction Type - Error Bad Byte', () => {
//     const badByte = 0xff;

//     const typeThrow = () => assertTransactionType(badByte);

//     expect(typeThrow).toThrowError(`Expected transaction type, found: ${badByte.toString(16)}`);
//   });
// });

// describe('Transaction Base Model', () => {
//   const hashString = '0e4068fa4b68f8351bc61e5b9d9e348bdb0a1f5e4c727c263c2534bb2bd19709';
//   const hash = common.hexToUInt256(hashString);

//   const privateKey = common.asPrivateKey(Buffer.from(_.range(32).map(() => 0x01)));
//   const testSig = Buffer.from(_.range(64).map(() => 0x00));
//   const testEC = common.ECPOINT_INFINITY;

//   test('Default Hash', () => {
//     const noHashModel = new InvocationTransactionModel({
//       ...optionsBuilder({ version: 1 }),
//       gas: new BN(1),
//       script: Buffer.from([0x01]),
//     });
//     expect(common.isUInt256(noHashModel.hash)).toBeTruthy();
//   });

//   test('Input Hash', () => {
//     const hashInModel = new InvocationTransactionModel({
//       ...optionsBuilder({ version: 1, hash }),
//       gas: new BN(1),
//       script: Buffer.from([0x01]),
//     });
//     expect(hashInModel.hash).toEqual(hash);
//   });

//   test('HashHex Function', () => {
//     const hashInModel = new InvocationTransactionModel({
//       ...optionsBuilder({ version: 1, hash }),
//       gas: new BN(1),
//       script: Buffer.from([0x01]),
//     });
//     expect(hashInModel.hashHex).toEqual(`0x${hashString}`);
//   });

//   test('Sign', () => {
//     const model = new InvocationTransactionModel({
//       ...optionsBuilder({ version: 1 }),
//       gas: new BN(1),
//       script: Buffer.from([0x01]),
//     });
//     const signedModel = model.sign(privateKey);

//     expect(signedModel.scripts).toMatchSnapshot();
//   });

//   test('Sign w/ Signature Function', () => {
//     const model = new InvocationTransactionModel({
//       ...optionsBuilder({ version: 1 }),
//       gas: new BN(1),
//       script: Buffer.from([0x01]),
//     });
//     const signedModel = model.signWithSignature(testSig, testEC);

//     expect(signedModel.scripts).toMatchSnapshot();
//   });

//   test('Error - Max Attributes Throws', () => {
//     const badAmount = 17;
//     const modelThrows = () =>
//       new InvocationTransactionModel({
//         // tslint:disable-next-line:no-object-literal-type-assertion
//         ...optionsBuilder({ version: 1, attributes: { length: badAmount } as readonly AttributeModel[] }),
//         gas: new BN(1),
//         script: Buffer.from([0x01]),
//       });

//     expect(modelThrows).toThrowError(`Expected less than 16 attributes, found: ${badAmount}`);
//   });
// });
