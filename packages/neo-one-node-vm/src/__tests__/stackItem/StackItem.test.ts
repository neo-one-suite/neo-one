import { utils } from '@neo-one/client-common';
import { BN } from 'bn.js';
import _ from 'lodash';
import { factory } from '../../__data__';
import {
  AccountStackItem,
  assertStackItemType,
  AssetStackItem,
  AttributeStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ConsensusPayloadStackItem,
  ContractStackItem,
  ECPointStackItem,
  HeaderStackItem,
  InputStackItem,
  IntegerStackItem,
  NullStackItem,
  OutputStackItem,
  StackItemType,
  StorageContextStackItem,
  StringStackItem,
  UInt160StackItem,
  UInt256StackItem,
  ValidatorStackItem,
} from '../../stackItem';

describe('Stack Item Tests', () => {
  beforeEach(() => {
    factory.resetDataIndex();
  });

  test('Account Stack Item', () => {
    const account = factory.createAccount();
    const accountItem = new AccountStackItem(account);

    expect(accountItem.asAccount()).toEqual(account);
  });

  test('Boolean Stack Item - true', () => {
    const booleanItem = new BooleanStackItem(true);

    expect(booleanItem.asBigInteger()).toEqual(utils.ONE);
    expect(booleanItem.asBoolean()).toEqual(true);
    expect(booleanItem.asBuffer()).toEqual(Buffer.from([1]));
    expect(booleanItem.toContractParameter()).toMatchSnapshot();
    expect(booleanItem.serialize()).toEqual(Buffer.concat([Buffer.from([StackItemType.Boolean]), Buffer.from([0x01])]));
  });

  test('Boolean Stack Item - false', () => {
    const booleanItem = new BooleanStackItem(false);

    expect(booleanItem.asBigInteger()).toEqual(utils.ZERO);
    expect(booleanItem.asBoolean()).toEqual(false);
    expect(booleanItem.asBuffer()).toEqual(Buffer.from([]));
    expect(booleanItem.toContractParameter()).toMatchSnapshot();
    expect(booleanItem.serialize()).toEqual(Buffer.concat([Buffer.from([StackItemType.Boolean]), Buffer.from([0x00])]));
  });

  test('Buffer Stack Item', () => {
    const buff = Buffer.from([0]);
    const bufferItem = new BufferStackItem(buff);

    expect(bufferItem.asBuffer()).toEqual(buff);
    expect(bufferItem.toContractParameter()).toMatchSnapshot();
  });

  test('Integer Stack Item', () => {
    const int = new BN(1);
    const integerItem = new IntegerStackItem(int);

    expect(integerItem.toContractParameter()).toMatchSnapshot();
    expect(integerItem.serialize()).toEqual(
      Buffer.concat([
        Buffer.from([StackItemType.Integer]),
        Buffer.from([0x01]),
        Buffer.from(utils.toSignedBuffer(int)),
      ]),
    );
  });

  test('Integer Stack Item - Errors', () => {
    const badInt = new BN(Buffer.concat(_.range(33).map(() => Buffer.from([0xff]))));
    const integerStackItemThrows = () => new IntegerStackItem(badInt);

    expect(integerStackItemThrows).toThrowError('Integer too large. Max size is 256 bits.');
  });

  test('Output Stack Item', () => {
    const out = factory.createOutput();
    const outputStackItem = new OutputStackItem(out);

    expect(outputStackItem.asOutput()).toEqual(out);
  });

  test('ECPoint Stack Item', () => {
    const ecPoint = factory.createECPoint();
    const ecPointStackItem = new ECPointStackItem(ecPoint);

    expect(ecPointStackItem.asECPoint()).toEqual(ecPoint);
    expect(ecPointStackItem.asBuffer()).toEqual(Buffer.from(ecPoint));
    expect(ecPointStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('Contract Stack Item', () => {
    const contract = factory.createContract();
    const contractStackItem = new ContractStackItem(contract);

    expect(contractStackItem.asContract()).toEqual(contract);
  });

  test('Input Stack Item', () => {
    const input = factory.createInput();
    const inputStackItem = new InputStackItem(input);

    expect(inputStackItem.asInput()).toEqual(input);
  });

  test('Header Stack Item', () => {
    const header = factory.createHeader();
    const headerStackItem = new HeaderStackItem(header);

    expect(headerStackItem.asHeader()).toEqual(header);
    expect(headerStackItem.asBlockBase()).toEqual(header);
  });

  test('Block Stack Item', () => {
    const header = factory.createHeader();
    const block = factory.createBlock({ ...header });
    const blockStackItem = new BlockStackItem(block);

    expect(blockStackItem.asHeader()).toEqual(block.header);
    expect(blockStackItem.asBlockBase()).toEqual(block);
  });

  test('Asset Stack Item', () => {
    const asset = factory.createAsset();
    const assetStackItem = new AssetStackItem(asset);

    expect(assetStackItem.asAsset()).toEqual(asset);
  });

  test('UInt160 Stack Item', () => {
    const uInt160 = factory.createUInt160();
    const uInt160StackItem = new UInt160StackItem(uInt160);

    expect(uInt160StackItem.asUInt160()).toEqual(uInt160);
    expect(uInt160StackItem.asBuffer()).toEqual(Buffer.from(uInt160));
    expect(uInt160StackItem.toContractParameter()).toMatchSnapshot();
  });

  test('UInt256 Stack Item', () => {
    const uInt256 = factory.createUInt256();
    const uInt256StackItem = new UInt256StackItem(uInt256);

    expect(uInt256StackItem.asUInt256()).toEqual(uInt256);
    expect(uInt256StackItem.asBuffer()).toEqual(Buffer.from(uInt256));
    expect(uInt256StackItem.toContractParameter()).toMatchSnapshot();
  });

  test('Attribute Stack Item - Buffer', () => {
    const buff = Buffer.from('test', 'hex');
    const bufferAttribute = factory.createBufferAttribute({ value: buff });
    const bufferAttributeStackItem = new AttributeStackItem(bufferAttribute);

    expect(bufferAttributeStackItem.asAttributeStackItem()).toEqual(bufferAttributeStackItem);
    expect(bufferAttributeStackItem.asAttribute()).toEqual(bufferAttribute);
    expect(bufferAttributeStackItem.asBuffer()).toEqual(buff);
    expect(bufferAttributeStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('Attribute Stack Item - UInt160', () => {
    const uInt160 = factory.createUInt160();
    const uInt160Attribute = factory.createUInt160Attribute({ value: uInt160 });
    const uInt160AttributeStackItem = new AttributeStackItem(uInt160Attribute);

    expect(uInt160AttributeStackItem.asAttribute()).toEqual(uInt160Attribute);
    expect(uInt160AttributeStackItem.asBuffer()).toEqual(Buffer.from(uInt160));
    expect(uInt160AttributeStackItem.asUInt160()).toEqual(uInt160);
    expect(uInt160AttributeStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('Attribute Stack Item - UInt256', () => {
    const uInt256 = factory.createUInt256();
    const uInt256Attribute = factory.createUInt256Attribute({ value: uInt256 });
    const uInt256AttributeStackItem = new AttributeStackItem(uInt256Attribute);

    expect(uInt256AttributeStackItem.asAttribute()).toEqual(uInt256Attribute);
    expect(uInt256AttributeStackItem.asBuffer()).toEqual(Buffer.from(uInt256));
    expect(uInt256AttributeStackItem.asUInt256()).toEqual(uInt256);
    expect(uInt256AttributeStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('Attribute Stack Item - ECPoint', () => {
    const ecPoint = factory.createECPoint();
    const ecPointAttribute = factory.createECPointAttribute({ value: ecPoint });
    const ecPointAttributeStackItem = new AttributeStackItem(ecPointAttribute);

    expect(ecPointAttributeStackItem.asAttribute()).toEqual(ecPointAttribute);
    expect(ecPointAttributeStackItem.asBuffer()).toEqual(Buffer.from(ecPoint));
    expect(ecPointAttributeStackItem.asECPoint()).toEqual(ecPoint);
    expect(ecPointAttributeStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('Consensus Payload Stack Item', () => {
    const consensusPayload = factory.createConsensusPayload();
    const consensusPayloadStackItem = new ConsensusPayloadStackItem(consensusPayload);

    expect(consensusPayloadStackItem.asConsensusPayload()).toEqual(consensusPayload);
  });

  test('Validator Stack Item', () => {
    const validator = factory.createValidator();
    const validatorStackItem = new ValidatorStackItem(validator);

    expect(validatorStackItem.asValidator()).toEqual(validator);
  });

  test('StorageContext Stack Item', () => {
    const uInt160 = factory.createUInt160();
    const storageContextStackItem = new StorageContextStackItem(uInt160);

    expect(storageContextStackItem.asUInt160()).toEqual(uInt160);
    expect(storageContextStackItem.asBoolean()).toBeTruthy();
    expect(storageContextStackItem.asBuffer()).toEqual(Buffer.from(uInt160));
  });

  test('Null Stack Item', () => {
    const nullStackItem = new NullStackItem();
    const secondNullStackItem = new NullStackItem();

    expect(nullStackItem.equals(undefined)).toBe(false);
    expect(nullStackItem.equals(nullStackItem)).toBe(true);
    expect(nullStackItem.equals(secondNullStackItem)).toBe(false);
    expect(nullStackItem.equals(new BufferStackItem(Buffer.from([0])))).toBe(false);
    expect(() => nullStackItem.asBuffer()).toThrowError('Invalid Value. Expected Buffer');
    expect(nullStackItem.asBoolean()).toEqual(false);
    expect(nullStackItem.convertJSON()).toMatchSnapshot();
    expect(nullStackItem.serialize()).toEqual(Buffer.from([StackItemType.Null]));
  });

  test('String Stack Item', () => {
    const stringStackItem = new StringStackItem('test string');
    const secondString = new StringStackItem('second string');
    const anotherString = new StringStackItem('test string');

    expect(stringStackItem.value).toEqual('test string');
    expect(stringStackItem.equals(secondString)).toBeFalsy();
    expect(stringStackItem.equals(anotherString)).toBeTruthy();
    expect(stringStackItem.equals(stringStackItem)).toBeTruthy();
    expect(stringStackItem.equals(new BufferStackItem(Buffer.from([0])))).toBeFalsy();
    expect(stringStackItem.asBoolean()).toBeFalsy();
    expect(stringStackItem.asString()).toEqual('test string');
    expect(stringStackItem.asBuffer()).toMatchSnapshot();
    expect(stringStackItem.toStructuralKey()).toMatchSnapshot();
    expect(() => stringStackItem.serialize()).toThrowError('Unsupported StackItem serde.');
  });

  test('StackItemType - Throws On Bad Assert', () => {
    const badByte = 0x99;
    expect(() => assertStackItemType(badByte)).toThrowError(`Expected StackItemType, found: ${badByte.toString(16)}`);
  });
});
