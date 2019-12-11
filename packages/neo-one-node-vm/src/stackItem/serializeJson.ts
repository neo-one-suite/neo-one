import { ArrayStackItem } from './ArrayStackItem';
import { BooleanStackItem } from './BooleanStackItem';
import { BufferStackItem } from './BufferStackItem';
import { deserializeJson } from './deserializeJson';
import { UnsupportedStackItemJsonSerdeError } from './errors';
import { IntegerStackItem } from './IntegerStackItem';
import { MapStackItem } from './MapStackItem';
import { NullStackItem } from './NullStackItem';
import { StackItem } from './StackItem';
import { StringStackItem } from './StringStackItem';

export const serialize = (
  valueToSerialize: StackItem,
  // tslint:disable-next-line: no-any
): null | number | ReadonlyArray<any> | string | boolean | object => {
  if (valueToSerialize instanceof BufferStackItem) {
    return serialize(deserializeJson(valueToSerialize.asBuffer().toString('utf8')));
  }
  if (valueToSerialize instanceof NullStackItem) {
    // tslint:disable-next-line: no-null-keyword
    return null;
  }
  if (valueToSerialize instanceof ArrayStackItem) {
    return valueToSerialize.asArray().map(serialize);
  }
  if (valueToSerialize instanceof StringStackItem) {
    return valueToSerialize.asString();
  }
  if (valueToSerialize instanceof IntegerStackItem) {
    const bn = valueToSerialize.asBigInteger();
    try {
      return bn.toNumber();
    } catch {
      return bn.toString(10);
    }
  }
  if (valueToSerialize instanceof BooleanStackItem) {
    return valueToSerialize.asBoolean();
  }
  if (valueToSerialize instanceof MapStackItem) {
    return valueToSerialize.keysArray().reduce(
      (acc, key) => ({
        ...acc,
        [key.asString()]: serialize(valueToSerialize.get(key)),
      }),
      {},
    );
  }

  throw new UnsupportedStackItemJsonSerdeError();
};

export const serializeJson = (valueIn: StackItem): StringStackItem =>
  new StringStackItem(JSON.stringify(serialize(valueIn)));
