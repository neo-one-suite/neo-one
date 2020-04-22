import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import { data, keys } from '../../../__data__';
import { BinaryWriter } from '../../../BinaryWriter';
import { common, UInt256 } from '../../../common';
import { addressToScriptHash } from '../../../helpers';
import { AttributeModel, BufferAttributeModel, UInt160AttributeModel, WitnessModel } from '../../../models';
import {
  assertTransactionType,
  ClaimTransactionModel,
  InputModel,
  InvocationTransactionModel,
  OutputModel,
} from '../../../models/transaction';

interface Options {
  readonly version: number;
  readonly attributes: readonly AttributeModel[];
  readonly inputs: readonly InputModel[];
  readonly outputs: readonly OutputModel[];
  readonly scripts: readonly WitnessModel[];
  readonly hash?: UInt256;
}

const optionsBuilder = ({
  version = 0,
  attributes = [],
  inputs = [],
  outputs = [],
  scripts = [],
  hash,
}: Partial<Options>): Options => ({
  version,
  attributes,
  inputs,
  outputs,
  scripts,
  hash,
});

const defaultInput = new InputModel({ hash: common.ZERO_UINT256, index: 1 });
const options = {
  asset: common.ZERO_UINT256,
  value: new BN(1),
  address: common.ZERO_UINT160,
};

const outputModel = new OutputModel(options);

// tslint:disable-next-line:no-let
let testWriter: BinaryWriter = new BinaryWriter();

const resetWriter = () => {
  testWriter = new BinaryWriter();
};

describe('Claim Transaction Model', () => {
  beforeEach(resetWriter);

  const claims = [defaultInput];
  const claimModel = new ClaimTransactionModel({ ...optionsBuilder({}), claims });

  test('Serialize Exclusive Base', () => {
    claimModel.serializeExclusiveBase(testWriter);
    expect(testWriter.toBuffer()).toEqual(
      Buffer.concat([Buffer.from([0x01]), Buffer.from(_.range(32).map(() => 0x00)), Buffer.from([0x01, 0x00])]),
    );
  });

  test('Clone Model', () => {
    const clonedModel = claimModel.clone({});
    expect(clonedModel.hash).toEqual(claimModel.hash);
    expect(clonedModel.version).toEqual(clonedModel.version);
    expect(clonedModel.claims).toEqual(claims);
  });

  test('Error - Bad Version', () => {
    const throwVersion = () => new ClaimTransactionModel({ ...optionsBuilder({ version: 1 }), claims });
    expect(throwVersion).toThrowError(`expected version 0, found: 1`);
  });

  test('Error - Bad Claims', () => {
    const throwClaims = () => new ClaimTransactionModel({ ...optionsBuilder({}), claims: [] });

    expect(throwClaims).toThrowError('expected claims, found none.');
  });
});

describe('Invocation Transaction Model', () => {
  beforeEach(resetWriter);

  const gas = new BN(1);
  const script = Buffer.from([0x01]);

  const invokeModel = new InvocationTransactionModel({ ...optionsBuilder({}), gas, script });

  test('InvokeModel - Serialize Exclusive Base', () => {
    invokeModel.serializeExclusiveBase(testWriter);
    expect(testWriter.toBuffer()).toEqual(Buffer.concat([Buffer.from([script.length]), script]));
  });

  test('InvokeModel v1 - Serialize Exclusive Base', () => {
    const versionOneModel = new InvocationTransactionModel({ ...optionsBuilder({}), version: 1, gas, script });
    versionOneModel.serializeExclusiveBase(testWriter);
    expect(testWriter.toBuffer()).toEqual(
      Buffer.concat([Buffer.from([script.length]), script, gas.toTwos(8 * 8).toArrayLike(Buffer, 'le', 8)]),
    );
  });

  test('Clone Model', () => {
    const clonedModel = invokeModel.clone({});
    expect(JSON.stringify(invokeModel)).toEqual(JSON.stringify(clonedModel));
  });

  test('Error - Bad Gas', () => {
    const badGas = new BN(-1);
    const gasThrow = () => new InvocationTransactionModel({ ...optionsBuilder({}), gas: badGas, script });
    expect(gasThrow).toThrowError(`expected valid gas, found: ${badGas.toString()}`);
  });

  test('Error - Bad Script', () => {
    const badScript = Buffer.from([]);
    const scriptThrow = () => new InvocationTransactionModel({ ...optionsBuilder({}), gas, script: badScript });
    expect(scriptThrow).toThrowError('expected script');
  });

  test('Error - Bad Version', () => {
    const badVersion = 2;
    const versionThrow = () =>
      new InvocationTransactionModel({ ...optionsBuilder({}), version: badVersion, gas, script });
    expect(versionThrow).toThrowError(`expected version <= 1, found: ${badVersion}`);
  });

  test('getScriptHashesForVerifying', async () => {
    const model = new InvocationTransactionModel({
      ...optionsBuilder({
        inputs: [defaultInput],
        outputs: [outputModel],
        attributes: [
          new UInt160AttributeModel({
            usage: 0x20,
            value: common.hexToUInt160(addressToScriptHash(data.attributes.script.data)),
          }),
          new BufferAttributeModel({
            usage: 0x90,
            value: Buffer.from(data.attributes.description.data, 'hex'),
          }),
        ],
      }),
      gas,
      script,
    });
    const result = await model.getScriptHashesForVerifying({
      getOutput: jest.fn(async () =>
        Promise.resolve({
          asset: common.uInt256ToHex(options.asset),
          value: new BigNumber(1),
          address: keys[0].address,
        }),
      ),
      getAsset: jest.fn(async () =>
        Promise.resolve({
          hash: data.hash256s.a,
          available: new BigNumber(10000),
          expiration: 6000000,
          frozen: false,
          ...data.assetRegisters.duty,
        }),
      ),
    });

    expect(result).toEqual([
      addressToScriptHash(keys[0].address),
      common.uInt160ToHex(options.address),
      addressToScriptHash(data.attributes.script.data),
    ]);
  });
});

describe('Output Model', () => {
  beforeEach(resetWriter);

  test('Serialize Wire Base', () => {
    outputModel.serializeWireBase(testWriter);
    expect(testWriter.toBuffer()).toEqual(
      Buffer.concat([
        common.uInt256ToBuffer(options.asset),
        Buffer.from(options.value.toTwos(8 * 8).toArrayLike(Buffer, 'le', 8)),
        Buffer.from(options.address),
      ]),
    );
  });

  test('Clone Model', () => {
    const clonedModel = outputModel.clone({});
    expect(clonedModel.address).toEqual(outputModel.address);
    expect(clonedModel.asset).toEqual(outputModel.asset);
  });
});

describe('Transaction Type Model', () => {
  test('Assert Transaction Type', () => {
    const goodByte = 0x00;

    expect(assertTransactionType(goodByte)).toEqual(goodByte);
  });

  test('Assert Transaction Type - Error Bad Byte', () => {
    const badByte = 0xff;

    const typeThrow = () => assertTransactionType(badByte);

    expect(typeThrow).toThrowError(`Expected transaction type, found: ${badByte.toString(16)}`);
  });
});

describe('Transaction Base Model', () => {
  const hashString = '0e4068fa4b68f8351bc61e5b9d9e348bdb0a1f5e4c727c263c2534bb2bd19709';
  const hash = common.hexToUInt256(hashString);

  const privateKey = common.asPrivateKey(Buffer.from(_.range(32).map(() => 0x01)));
  const testSig = Buffer.from(_.range(64).map(() => 0x00));
  const testEC = common.ECPOINT_INFINITY;

  test('Default Hash', () => {
    const noHashModel = new InvocationTransactionModel({
      ...optionsBuilder({ version: 1 }),
      gas: new BN(1),
      script: Buffer.from([0x01]),
    });
    expect(common.isUInt256(noHashModel.hash)).toBeTruthy();
  });

  test('Input Hash', () => {
    const hashInModel = new InvocationTransactionModel({
      ...optionsBuilder({ version: 1, hash }),
      gas: new BN(1),
      script: Buffer.from([0x01]),
    });
    expect(hashInModel.hash).toEqual(hash);
  });

  test('HashHex Function', () => {
    const hashInModel = new InvocationTransactionModel({
      ...optionsBuilder({ version: 1, hash }),
      gas: new BN(1),
      script: Buffer.from([0x01]),
    });
    expect(hashInModel.hashHex).toEqual(`0x${hashString}`);
  });

  test('Sign', () => {
    const model = new InvocationTransactionModel({
      ...optionsBuilder({ version: 1 }),
      gas: new BN(1),
      script: Buffer.from([0x01]),
    });
    const signedModel = model.sign(privateKey);

    expect(signedModel.scripts).toMatchSnapshot();
  });

  test('Sign w/ Signature Function', () => {
    const model = new InvocationTransactionModel({
      ...optionsBuilder({ version: 1 }),
      gas: new BN(1),
      script: Buffer.from([0x01]),
    });
    const signedModel = model.signWithSignature(testSig, testEC);

    expect(signedModel.scripts).toMatchSnapshot();
  });

  test('Error - Max Attributes Throws', () => {
    const badAmount = 17;
    const modelThrows = () =>
      new InvocationTransactionModel({
        // tslint:disable-next-line:no-object-literal-type-assertion
        ...optionsBuilder({ version: 1, attributes: { length: badAmount } as readonly AttributeModel[] }),
        gas: new BN(1),
        script: Buffer.from([0x01]),
      });

    expect(modelThrows).toThrowError(`Expected less than 16 attributes, found: ${badAmount}`);
  });
});
