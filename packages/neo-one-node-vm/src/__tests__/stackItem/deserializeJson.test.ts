import { BN } from 'bn.js';
import {
  ArrayStackItem,
  BooleanStackItem,
  deserializeJson,
  IntegerStackItem,
  MapStackItem,
  NullStackItem,
  StringStackItem,
} from '../../stackItem';
import { nestedJson, simpleJson } from '../syscalls.test';

describe('deserializeJson', () => {
  test('incorrect JSON', () => {
    expect(() => deserializeJson('x')).toThrowError('Invalid JSON: Unexpected token x in JSON at position 0.');
    expect(() => deserializeJson('')).toThrowError('Invalid JSON: Unexpected end of JSON input.');
  });
  test('empty object', () => {
    const deserializedEmptyObject = deserializeJson('{}') as MapStackItem;
    expect(deserializedEmptyObject).toBeInstanceOf(MapStackItem);
    expect(deserializedEmptyObject.size).toEqual(0);
  });
  test('empty array', () => {
    const deserializedEmptyArray = deserializeJson('[]');
    expect(deserializedEmptyArray).toBeInstanceOf(ArrayStackItem);
    expect(deserializedEmptyArray.size).toEqual(0);
  });
  test('valid object', () => {
    const validObj = deserializeJson(`{\"test1\":123,\"test2\":321}`) as MapStackItem;
    expect(validObj).toBeInstanceOf(MapStackItem);
    expect(validObj.size).toEqual(2);
    const firstVal = validObj.get(new StringStackItem('test1'));
    expect(firstVal).toBeTruthy();
    expect(firstVal.asBigInteger().toNumber()).toEqual(123);
    const secondVal = validObj.get(new StringStackItem('test2'));
    expect(secondVal).toBeTruthy();
    expect(secondVal.asBigInteger().toNumber()).toEqual(321);
    expect(validObj.valuesArray().map((val) => val.asBigInteger())).toEqual([new BN(123), new BN(321)]);
  });
  test('array of bool, str, num', () => {
    const validArr = deserializeJson(`[true,\"test\",123]`) as ArrayStackItem;
    expect(validArr).toBeInstanceOf(ArrayStackItem);
    expect(validArr.size).toEqual(3);
    const asArr = validArr.asArray();
    expect(Array.isArray(asArr)).toBeTruthy();
    expect(asArr[0].asBoolean()).toBeTruthy();
    expect(asArr[1].asString()).toEqual('test');
    expect(asArr[2].asBigInteger().toNumber()).toEqual(123);
  });
  test('nested array', () => {
    const nestedArr = deserializeJson(`[[true,\"test1\",123],[true,\"test2\",321]]`) as ArrayStackItem;
    const nestedAsArr = nestedArr.asArray();
    expect(nestedArr).toBeInstanceOf(ArrayStackItem);
    expect(Array.isArray(nestedAsArr)).toBeTruthy();
    const firstArr = nestedAsArr[0];
    expect(firstArr).toBeInstanceOf(ArrayStackItem);
    expect(Array.isArray(firstArr.asArray())).toBeTruthy();
    expect(firstArr.size).toEqual(3);
    expect(firstArr.asArray()[0].asBoolean()).toBeTruthy();
    expect(firstArr.asArray()[1].asString()).toEqual('test1');
    expect(
      firstArr
        .asArray()[2]
        .asBigInteger()
        .toNumber(),
    ).toEqual(123);
    const secondArr = nestedAsArr[1];
    expect(secondArr.size).toEqual(3);
    expect(secondArr.asArray()[0]).toBeTruthy();
    expect(secondArr.asArray()[1].asString()).toEqual('test2');
    expect(
      secondArr
        .asArray()[2]
        .asBigInteger()
        .toNumber(),
    ).toEqual(321);
  });
  test('object returns MapStackItem', () => {
    const deserializedSimpleJson = deserializeJson(JSON.stringify(simpleJson));
    expect(deserializedSimpleJson).toBeInstanceOf(MapStackItem);
    expect(deserializedSimpleJson).toMatchSnapshot();
    const deserializedNestedJson = deserializeJson(JSON.stringify(nestedJson));
    expect(deserializedNestedJson).toBeInstanceOf(MapStackItem);
    expect(deserializedNestedJson).toMatchSnapshot();
  });
  test('null returns NullStackItem', () => {
    expect(deserializeJson('null')).toBeInstanceOf(NullStackItem);
    expect(deserializeJson('null')).toMatchSnapshot();
  });
  test('array returns ArrayStackItem', () => {
    expect(deserializeJson('[]')).toBeInstanceOf(ArrayStackItem);
    // tslint:disable-next-line: no-null-keyword
    const nestedArray = deserializeJson(JSON.stringify(['Test string', 5, true, null, ['string']]));
    const internals = [
      new StringStackItem('Test string'),
      new IntegerStackItem(new BN(5)),
      new BooleanStackItem(true),
      new NullStackItem(),
      new ArrayStackItem([new StringStackItem('string')]),
    ];
    expect(nestedArray).toBeInstanceOf(ArrayStackItem);
    nestedArray
      .asArray()
      .slice(0, internals.length - 2)
      .forEach((item, i) => expect(item).toEqual(internals[i]));
    expect(internals[internals.length - 2]).toBeInstanceOf(NullStackItem);
    expect(internals[internals.length - 2]).toMatchSnapshot();
    expect(internals[internals.length - 1]).toBeInstanceOf(ArrayStackItem);
    expect(internals[internals.length - 1].asArray()[0]).toEqual(new StringStackItem('string'));
  });
  test('number returns IntegerStackItem', () => {
    expect(deserializeJson('1')).toEqual(new IntegerStackItem(new BN(1)));
    expect(deserializeJson('-1')).toEqual(new IntegerStackItem(new BN(-1)));
  });
  test('boolean returns BooleanStackItem', () => {
    expect(deserializeJson('false')).toEqual(new BooleanStackItem(false));
    expect(deserializeJson('true')).toEqual(new BooleanStackItem(true));
  });
});
