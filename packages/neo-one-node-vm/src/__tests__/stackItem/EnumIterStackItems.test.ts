import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable';
import { BN } from 'bn.js';
import { deserializeStackItem } from '../..';
import {
  BooleanStackItem,
  EnumeratorStackItem,
  IntegerStackItem,
  StackItemEnumerator,
  StackItemIterator,
} from '../../stackItem';

describe('Enumerator/Iterator Stack Item Types', () => {
  const testIterator: ReadonlyArray<{ readonly key: IntegerStackItem; readonly value: IntegerStackItem }> = [
    { key: new IntegerStackItem(new BN(0)), value: new IntegerStackItem(new BN(1)) },
  ];
  const testAsyncIterable = AsyncIterableX.from(testIterator);

  const stackItemEnumerator = new StackItemEnumerator(testAsyncIterable[Symbol.asyncIterator]());
  const stackItemIterator = new StackItemIterator(testAsyncIterable[Symbol.asyncIterator]());
  const enumeratorStackItem = new EnumeratorStackItem(stackItemEnumerator);

  test('StackItemEnumerator - mutableCurrent throws before .next() called', () => {
    expect(() => stackItemEnumerator.value()).toThrowError(
      'Current is not set. The enumerator has been fully consumed or has not been initialized',
    );
  });

  test('StackItemEnumerator - start of iterating done - false', () => {
    expect(stackItemEnumerator.done).toBeFalsy();
  });

  test('StackItemEnumerator - equals', () => {
    expect(stackItemEnumerator.equals(stackItemEnumerator)).toBeTruthy();
    expect(stackItemEnumerator.equals(true)).toBeFalsy();
  });

  test('StackItemEnumerator - next', async () => {
    expect(await stackItemEnumerator.next()).toBeTruthy(); // first .next() has a value.
    expect(await stackItemEnumerator.next()).toBeFalsy(); // sets this.mutableDone to true, returns false
    expect(await stackItemEnumerator.next()).toBeFalsy(); // returns !this.mutableDone
  });

  test('StackItemIterator - mutableCurrent throws before initialized', () => {
    expect(() => stackItemIterator.key()).toThrowError(
      'Current is not set. The iterator has been fully consumed or has not been initialized',
    );
  });

  test('EnumeratorStackItem - toStructuralKey', () => {
    expect(enumeratorStackItem.toStructuralKey()).toMatchSnapshot();
  });

  test('EnumeratorStackItem - equals', () => {
    expect(enumeratorStackItem.equals(enumeratorStackItem)).toBeTruthy();
    expect(enumeratorStackItem.equals(true)).toBeFalsy();
  });
});

describe('Deserialize Stack Item Tests', () => {
  const booleanStackItem = new BooleanStackItem(true);
  const integerStackItem = new IntegerStackItem(new BN(0));

  const serialBooleanItem = booleanStackItem.serialize();
  const serialIntegerItem = integerStackItem.serialize();

  test('Deserialize BooleanStackItem', () => {
    expect(deserializeStackItem(serialBooleanItem)).toEqual(booleanStackItem);
  });

  test('Deserialize IntegerStackItem', () => {
    expect(deserializeStackItem(serialIntegerItem)).toEqual(integerStackItem);
  });
});
