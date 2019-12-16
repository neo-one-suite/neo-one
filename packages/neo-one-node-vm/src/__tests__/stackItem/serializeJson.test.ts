import { BN } from 'bn.js';
import { factory } from '../../__data__';
import {
  ArrayStackItem,
  BooleanStackItem,
  BufferStackItem,
  ECPointStackItem,
  IntegerStackItem,
  MapStackItem,
  NullStackItem,
  serializeJson,
  StringStackItem,
} from '../../stackItem';
import {
  createKeysMap,
  createValuesMap,
  nestedJson,
  nestedJsonToBuffer,
  nestedMapStackItem,
  simpleJson,
  simpleJsonToBuffer,
  simpleMapStackItem,
} from '../syscalls.test';

describe('serializeJson', () => {
  test('wrong JSON (from neo-project/neo)', () => {
    expect(() => serializeJson(new ECPointStackItem(factory.createECPoint()))).toThrowError(
      'Unsupported StackItem JSON serde.',
    );
  });
  test('empty object (from neo-project/neo)', () => {
    expect(serializeJson(new MapStackItem())).toEqual(new StringStackItem(JSON.stringify({})));
  });
  test('number (from neo-project/neo)', () => {
    expect(serializeJson(new IntegerStackItem(new BN(1)))).toEqual(new StringStackItem('1'));
    expect(serializeJson(new IntegerStackItem(new BN('9007199254740992'), false))).toEqual(
      new StringStackItem(JSON.stringify('9007199254740992')),
    );
  });
  test('empty array (from neo-project/neo)', () => {
    expect(serializeJson(new ArrayStackItem([]))).toEqual(new StringStackItem(JSON.stringify([])));
  });
  test('map (from neo-project/neo)', () => {
    const keys = [new StringStackItem('test1'), new StringStackItem('test2'), new StringStackItem('test3')];
    const values = [new IntegerStackItem(new BN(1)), new IntegerStackItem(new BN(3)), new IntegerStackItem(new BN(2))];
    expect(
      serializeJson(
        new MapStackItem({ referenceKeys: createKeysMap(keys), referenceValues: createValuesMap(keys, values) }),
      ),
    ).toEqual(new StringStackItem(JSON.stringify({ test1: 1, test2: 3, test3: 2 })));
  });
  test('array of bool, str, num (from neo-project/neo)', () => {
    expect(
      serializeJson(
        new ArrayStackItem([
          new BooleanStackItem(true),
          new StringStackItem('test'),
          new IntegerStackItem(new BN(123)),
        ]),
      ),
    ).toEqual(new StringStackItem(JSON.stringify([true, 'test', 123])));
  });
  test('nested array (from neo-project/neo)', () => {
    const array = new ArrayStackItem([
      new ArrayStackItem([new BooleanStackItem(true), new StringStackItem('test1'), new IntegerStackItem(new BN(123))]),
      new ArrayStackItem([new BooleanStackItem(true), new StringStackItem('test2'), new IntegerStackItem(new BN(321))]),
    ]);
    expect(serializeJson(array)).toEqual(
      new StringStackItem(JSON.stringify([[true, 'test1', 123], [true, 'test2', 321]])),
    );
  });
  test('BufferStackItem returns correctly', () => {
    expect(serializeJson(new BufferStackItem(simpleJsonToBuffer))).toEqual(
      new StringStackItem(JSON.stringify(simpleJson)),
    );
    expect(serializeJson(new BufferStackItem(nestedJsonToBuffer))).toEqual(
      new StringStackItem(JSON.stringify(nestedJson)),
    );
  });
  test('MapStackItem returns object', () => {
    expect(serializeJson(simpleMapStackItem)).toEqual(new StringStackItem(JSON.stringify(simpleJson)));
    expect(serializeJson(nestedMapStackItem)).toEqual(new StringStackItem(JSON.stringify(nestedJson)));
  });
  test('NullStackItem returns null', () => {
    expect(serializeJson(new NullStackItem())).toEqual(new StringStackItem('null'));
  });
  test('ArrayStackItem returns array', () => {
    expect(serializeJson(new ArrayStackItem([]))).toEqual(new StringStackItem('[]'));
    expect(
      serializeJson(
        new ArrayStackItem([
          new NullStackItem(),
          new StringStackItem('Test string'),
          new IntegerStackItem(new BN(5)),
          new BooleanStackItem(true),
          new ArrayStackItem([new StringStackItem('string')]),
        ]),
      ),
      // tslint:disable-next-line: no-null-keyword
    ).toEqual(new StringStackItem(JSON.stringify([null, 'Test string', 5, true, ['string']])));
  });
  test('StringStackItem returns string', () => {
    expect(serializeJson(new StringStackItem(''))).toEqual(new StringStackItem(JSON.stringify('')));
    expect(serializeJson(new StringStackItem('This is a long string with {}, [], 10, null, undefined'))).toEqual(
      new StringStackItem(JSON.stringify('This is a long string with {}, [], 10, null, undefined')),
    );
  });
  test('IntegerStackItem returns number', () => {
    expect(serializeJson(new IntegerStackItem(new BN(1)))).toEqual(new StringStackItem('1'));
    expect(serializeJson(new IntegerStackItem(new BN(-1)))).toEqual(new StringStackItem('-1'));
  });
  test('BooleanStackItem returns boolean', () => {
    expect(serializeJson(new BooleanStackItem(false))).toEqual(new StringStackItem('false'));
    expect(serializeJson(new BooleanStackItem(true))).toEqual(new StringStackItem('true'));
  });
});
