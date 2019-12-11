import { BN } from 'bn.js';
import { ArrayStackItem } from './ArrayStackItem';
import { BooleanStackItem } from './BooleanStackItem';
import { InvalidJsonError } from './errors';
import { IntegerStackItem } from './IntegerStackItem';
import { MapStackItem } from './MapStackItem';
import { NullStackItem } from './NullStackItem';
import { StackItem } from './StackItem';
import { StringStackItem } from './StringStackItem';

// tslint:disable-next-line: no-any
const deserialize = (valueToDeserialize: any): StackItem => {
  if (valueToDeserialize === null || valueToDeserialize === undefined) {
    return new NullStackItem();
  }
  if (Array.isArray(valueToDeserialize)) {
    return new ArrayStackItem(valueToDeserialize.map(deserialize));
  }
  if (typeof valueToDeserialize === 'string') {
    return new StringStackItem(valueToDeserialize);
  }
  if (typeof valueToDeserialize === 'number') {
    return new IntegerStackItem(new BN(valueToDeserialize));
  }
  if (typeof valueToDeserialize === 'boolean') {
    return new BooleanStackItem(valueToDeserialize);
  }
  if (typeof valueToDeserialize === 'object') {
    const referenceKeys = new Map<string, StackItem>();
    const referenceValues = new Map<string, StackItem>();
    Object.entries(valueToDeserialize as object).forEach(([property, value]) => {
      const key = deserialize(property);
      const val = deserialize(value);
      const referenceKey = key.toStructuralKey();
      referenceKeys.set(referenceKey, key);
      referenceValues.set(referenceKey, val);
    });

    return new MapStackItem({ referenceKeys, referenceValues });
  }
  throw new InvalidJsonError();
};

export const deserializeJson = (inputValue: string): StackItem => deserialize(JSON.parse(inputValue));
