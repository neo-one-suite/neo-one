import BN from 'bn.js';
import { ArrayStackItem, IntegerStackItem, MapStackItem } from '../../stackItem';

describe('StackItem', () => {
  test('simple', () => {
    const stackItem = new IntegerStackItem(new BN(10));

    expect(stackItem.increment()).toEqual(1);
    expect(stackItem.increment()).toEqual(1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
  });

  test('array', () => {
    const stackItem = new ArrayStackItem([new IntegerStackItem(new BN(10)), new IntegerStackItem(new BN(11))]);

    expect(stackItem.increment()).toEqual(3);
    expect(stackItem.decrement()).toEqual(-3);
  });

  test('APPEND - array circular on stack', () => {
    // [value] PUSH10
    const a = new IntegerStackItem(new BN(10));
    expect(a.increment()).toEqual(1);
    // [value, value] PUSH10
    const b = new IntegerStackItem(new BN(10));
    expect(b.increment()).toEqual(1);

    // [number, value, value] PUSH2
    const c = new IntegerStackItem(new BN(10));
    expect(c.increment()).toEqual(1);

    // [arr] PACK
    expect(a.decrement()).toEqual(-1);
    expect(b.decrement()).toEqual(-1);
    expect(c.decrement()).toEqual(-1);
    const stackItem = new ArrayStackItem([a, b]);
    expect(stackItem.increment()).toEqual(3);

    // [arr, arr] DUP
    expect(stackItem.increment()).toEqual(1);
    // [arr, arr, arr] DUP
    expect(stackItem.increment()).toEqual(1);

    // [arr] APPEND
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    // tslint:disable-next-line no-array-mutation
    stackItem.value.push(stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [arr, arr] DUP
    expect(stackItem.increment()).toEqual(1);
    // [arr, arr, arr] DUP
    expect(stackItem.increment()).toEqual(1);

    // [arr] APPEND
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    // tslint:disable-next-line no-array-mutation
    stackItem.value.push(stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [] DROP
    expect(stackItem.decrement()).toEqual(-5);
  });

  test('APPEND - array circular on stack, consumed', () => {
    // [value] PUSH10
    const a = new IntegerStackItem(new BN(10));
    expect(a.increment()).toEqual(1);
    // [value, value] PUSH10
    const b = new IntegerStackItem(new BN(10));
    expect(b.increment()).toEqual(1);

    // [number, value, value] PUSH2
    const c = new IntegerStackItem(new BN(10));
    expect(c.increment()).toEqual(1);

    // [arr] PACK
    expect(a.decrement()).toEqual(-1);
    expect(b.decrement()).toEqual(-1);
    expect(c.decrement()).toEqual(-1);
    const stackItem = new ArrayStackItem([a, b]);
    expect(stackItem.increment()).toEqual(3);

    // [arr, arr] DUP
    expect(stackItem.increment()).toEqual(1);

    // [] APPEND
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-3);
    // tslint:disable-next-line no-array-mutation
    stackItem.value.push(stackItem);
  });

  test('SETITEM - map circular on stack', () => {
    // [map] NEWMAP
    const stackItem = new MapStackItem();
    expect(stackItem.increment()).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] SETITEM
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.set(stackItem, stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [] DROP
    expect(stackItem.decrement()).toEqual(-3);
  });

  test('SETITEM - map circular on stack, consumed', () => {
    // [map] NEWMAP
    const stackItem = new MapStackItem();
    expect(stackItem.increment()).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] SETITEM
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.set(stackItem, stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [] DROP
    expect(stackItem.decrement()).toEqual(-3);
  });

  test('REMOVE - map circular on stack', () => {
    // [map] NEWMAP
    const stackItem = new MapStackItem();
    expect(stackItem.increment()).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] SETITEM
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.set(stackItem, stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] REMOVE
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.delete(stackItem);
    expect(stackItem.referenceCount).toEqual(1);
    expect(stackItem.decrement(new Set([stackItem]))).toEqual(-1);
    expect(stackItem.decrement(new Set([stackItem]))).toEqual(-1);

    // [] DROP
    expect(stackItem.decrement()).toEqual(-1);
  });

  test('REMOVE - map circular on stack, consumed', () => {
    // [map] NEWMAP
    const stackItem = new MapStackItem();
    expect(stackItem.increment()).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] SETITEM
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.set(stackItem, stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [] REMOVE
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-3);
    stackItem.delete(stackItem);
    expect(stackItem.referenceCount).toEqual(0);
  });

  test('KEYS + DROP - map circular on stack', () => {
    // [map] NEWMAP
    const stackItem = new MapStackItem();
    expect(stackItem.increment()).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] SETITEM
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.set(stackItem, stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [arr, map] KEYS
    expect(stackItem.decrement()).toEqual(-1);
    const arr = new ArrayStackItem([stackItem]);
    expect(arr.increment()).toEqual(2);

    // [arr] DROP
    expect(arr.decrement()).toEqual(-2);
    // []
    expect(stackItem.decrement()).toEqual(-3);
  });

  test('KEYS + NIP - map circular on stack', () => {
    // [map] NEWMAP
    const stackItem = new MapStackItem();
    expect(stackItem.increment()).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);
    // [map, map, map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [map] SETITEM
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    expect(stackItem.decrement()).toEqual(-1);
    stackItem.set(stackItem, stackItem);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);
    expect(stackItem.increment(new Set([stackItem]))).toEqual(1);

    // [map, map] DUP
    expect(stackItem.increment()).toEqual(1);

    // [arr, map] KEYS
    expect(stackItem.decrement()).toEqual(-1);
    const arr = new ArrayStackItem([stackItem]);
    expect(arr.increment()).toEqual(2);

    // [arr] NIPF
    expect(stackItem.decrement()).toEqual(-1);
    // []
    expect(arr.decrement()).toEqual(-4);
  });
});
