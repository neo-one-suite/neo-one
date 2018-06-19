import { common } from '@neo-one/client-core';
import { helpers } from '../../__data__';

describe('syscalls', () => {
  test('Neo.Runtime.GetTime', async () => {
    await helpers.executeString(`
      if (syscall('Neo.Runtime.GetTime') === undefined) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Runtime.Serialize/Deserialize array', async () => {
    await helpers.executeString(`
      const foo = [1, 2, 3];
      const serialized = syscall('Neo.Runtime.Serialize', foo);
      const deserialized = (syscall('Neo.Runtime.Deserialize', serialized) as Array<number>);

      if (deserialized[0] !== 1) {
        throw 'Failure';
      }

      if (deserialized[1] !== 2) {
        throw 'Failure';
      }

      if (deserialized[2] !== 3) {
        throw 'Failure';
      }

      if (deserialized.length !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('Neo.Runtime.Call', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      const x = syscall('Neo.Runtime.GetArgument', 0) as number;
      const y = syscall('Neo.Runtime.GetArgument', 1) as number;
      syscall('Neo.Runtime.Return', x * y);
    `);
    await node.executeString(`
      const result = syscall(
        'Neo.Runtime.Call',
        Buffer.from("${common.uInt160ToString(contract).slice(2)}", 'hex'),
        2,
        3,
      ) as number;
      if (result !== 6) {
        throw 'Failure';
      }
  `);
  });

  test('Neo.Enumerator.Create/Next', async () => {
    await helpers.executeString(`
      const foo = [1,2];
      const enumerator = syscall('Neo.Enumerator.Create', foo);
      let hasNext = syscall('Neo.Enumerator.Next', enumerator); // true
      hasNext = syscall('Neo.Enumerator.Next', enumerator); // true

      if (!hasNext) {
        throw 'Failed to identify "next" in enumeration of array';
      }

      hasNext = syscall('Neo.Enumerator.Next', enumerator); // false

      if (hasNext) {
        throw 'Failed to identify "next" in enumeration of array';
      }
      `);
  });

  test('Neo.Enumerator.Create/Next/Value with Array<string>', async () => {
    await helpers.executeString(`

      const foo = ['a','b'];
      const enumerator = syscall('Neo.Enumerator.Create', foo);
      const hasNext = syscall('Neo.Enumerator.Next', enumerator);
      let value = syscall('Neo.Enumerator.Value', enumerator);

      if(value!=='a'){
        throw 'Failed to fetch VALUE from enumerated array ';
      }

      syscall('Neo.Enumerator.Next', enumerator);

      value = syscall('Neo.Enumerator.Value', enumerator);

      if(value!=='b'){
        throw 'Failed to fetch VALUE from enumerated array ';
      }
      `);
  });
  test('Neo.Enumerator.Create/Next/Value with Array<number>', async () => {
    await helpers.executeString(`

      const foo = [1,2];
      const enumerator = syscall('Neo.Enumerator.Create', foo);
      const hasNext = syscall('Neo.Enumerator.Next', enumerator);
      let value = syscall('Neo.Enumerator.Value', enumerator);

      if(value!==1){
        throw 'Failed to fetch VALUE from enumerated array ';
      }

      syscall('Neo.Enumerator.Next', enumerator);

      value = syscall('Neo.Enumerator.Value', enumerator);

      if(value!==2){
        throw 'Failed to fetch VALUE from enumerated array ';
      }
      `);
  });

  test('Neo.Enumerator.Create/Concat/Next/Value of Array<string> &  Array<number>', async () => {
    await helpers.executeString(`
      const foo = ["A","B"];
      const bar = [42];
      const enumeratorA = syscall('Neo.Enumerator.Create', foo);
      const enumeratorB = syscall('Neo.Enumerator.Create', bar);
      const enumeratorC = syscall('Neo.Enumerator.Concat', enumeratorA, enumeratorB);
      let hasNext = syscall('Neo.Enumerator.Next', enumeratorC);
      hasNext = syscall('Neo.Enumerator.Next', enumeratorC);
      let value = syscall('Neo.Enumerator.Value', enumeratorC);

      if (value !== "B") {
        throw 'Failed to fetch value #2 "B" as <string>';
      }

      hasNext = syscall('Neo.Enumerator.Next', enumeratorC);
      value = syscall('Neo.Enumerator.Value', enumeratorC);

      if (value !== 42) {
        throw 'Failed to concat enumerators and return element #3 42 <number> ';
      }
      if (value === "42") {
        throw 'Failed to return number, instead returned string';
      }

      `);
  });

  test('Neo.Iterator.Create/Next/Value', async () => {
    await helpers.executeString(`
      const foo = new Map<string, string>();
      foo.set('thing', 'baz');
      foo.set('other', 'bar');
      const objectIterator = syscall('Neo.Iterator.Create', foo);

      let hasNext = syscall('Neo.Enumerator.Next', objectIterator);

      if (!hasNext) {
        throw 'failed to find Next from Map<K,V>';
      }
      let value = syscall('Neo.Enumerator.Value', objectIterator);

      if(value!=="baz"){
        throw 'Failed to fetch Value from Map<K,V>';
      }
      hasNext = syscall('Neo.Enumerator.Next', objectIterator);

      if(value!=="baz"){
        throw 'Failed to fetch Value from Map<K,V>';
      }
      value = syscall('Neo.Enumerator.Value', objectIterator);

      `);
  });
  test('Neo.Iterator.Create/Key', async () => {
    await helpers.executeString(`
    const foo = new Map<string, string>();
    foo.set('thing', 'baz');
    foo.set('other', 'bar');
    const iterator = syscall('Neo.Iterator.Create', foo);

    let hasNext = syscall('Neo.Enumerator.Next', iterator);
    let firstKey = syscall('Neo.Iterator.Key', iterator);
    hasNext = syscall('Neo.Enumerator.Next', iterator);
    let secondKey = syscall('Neo.Iterator.Key', iterator);

    if (firstKey!=='thing' || secondKey !== 'other') {
      throw 'failed to iterate over iterator and collect keys ';
    }
    `);
  });

  test.skip('Neo.Iterator.Create/Keys', async () => {
    await helpers.executeString(`
    const foo = new Map<string, string>();
    foo.set('thing', 'baz');
    foo.set('other', 'bar');
    const iterator = syscall('Neo.Iterator.Create', foo);
    const keyIterator = syscall('Neo.Iterator.Keys', iterator);

    let hasNext = syscall('Neo.Enumerator.Next', keyIterator);
    let firstKey = syscall('Neo.Enumerator.Value', keyIterator);
    hasNext = syscall('Neo.Enumerator.Next', keyIterator);
    let secondKey = syscall('Neo.Enumerator.Value', keyIterator);

    if (firstKey!=='thing' || secondKey !== 'other') {
      throw 'failed to iterate over iterator and collect keys ';
    }
    `);
  });

  test('Neo.Iterator.Create/Next/Values', async () => {
    await helpers.executeString(`
      const foo = new Map<string, string>();
      foo.set('thing', 'baz');
      foo.set('other', 'bar');
      const iterator = syscall('Neo.Iterator.Create', foo);
      const valuesEnumerator = syscall('Neo.Iterator.Values', iterator);
      let hasNext = syscall('Neo.Enumerator.Next', valuesEnumerator);
      let firstValue = syscall('Neo.Enumerator.Value', valuesEnumerator);

      if (!hasNext) {
        throw 'Failed to get value from iterator';
      }
      if (firstValue !== 'baz') {
        throw 'Failed to get value from iterator';
      }
      `);
  });

  test('Neo.Iterator.Create/Next/Value/concat', async () => {
    await helpers.executeString(`
      const foo = new Map<string, string>();
      foo.set('thing', 'baz');
      foo.set('other', 'bar');
      const iteratorA = syscall('Neo.Iterator.Create', foo);

      const bar = new Map<string, string>();
      bar.set('thing', 'flee');
      bar.set('other', 'flung');
      const iteratorB = syscall('Neo.Iterator.Create', bar);

      const iteratorC = syscall('Neo.Iterator.Concat', iteratorA, iteratorB);
      let hasNext = syscall('Neo.Enumerator.Next', iteratorC);
      let value = syscall('Neo.Enumerator.Value', iteratorC);

      if (value !== 'baz') {
        throw 'failed to retrieve first value of concatenated iterators';
      }

      hasNext = syscall('Neo.Enumerator.Next', iteratorC);
      value = syscall('Neo.Enumerator.Value', iteratorC);

      if (value !== 'bar') {
        throw 'failed to retrieve first value of concatenated iterators';
      }
      hasNext = syscall('Neo.Enumerator.Next', iteratorC);
      value = syscall('Neo.Enumerator.Value', iteratorC);

      if (value !== 'flee') {
        throw 'failed to retrieve third value of concatenated iterators';
      }
      hasNext = syscall('Neo.Enumerator.Next', iteratorC);
      value = syscall('Neo.Enumerator.Value', iteratorC);

      if (value !== 'flung') {
        throw 'failed to retrieve fourth value of concatenated iterators';
      }
      hasNext = syscall('Neo.Enumerator.Next', iteratorC);
      if (hasNext) {
        throw 'Unexpected hasNext of concatenated iterators';
      }

    `);
  });

  test('Neo.Runtime.Serialize/Deserialize generic', async () => {
    await helpers.executeString(
      `
      class Serializer<V extends SerializableValue> {
        public serialize(value: V): Buffer {
          return syscall('Neo.Runtime.Serialize', value);
        }

        public deserialize(value: Buffer): V {
          return (syscall('Neo.Runtime.Deserialize', value) as V);
        }
      }

      const serializer = new Serializer<Array<Array<number | boolean>>>();

      const foo = [[1], [2, true], [false, 3]];
      const serialized = serializer.serialize(foo);
      const deserialized = serializer.deserialize(serialized);

      if (deserialized[0][0] !== 1) {
        throw 'Failure';
      }

      if (deserialized[1][0] !== 2) {
        throw 'Failure';
      }

      if (deserialized[1][1] !== true) {
        throw 'Failure';
      }

      if (deserialized[2][0] !== false) {
        throw 'Failure';
      }

      if (deserialized[2][1] !== 3) {
        throw 'Failure';
      }
    `,
      { ignoreWarnings: true },
    );
  });

  test('Neo.Runtime.Notify', async () => {
    await helpers.executeString(`
      syscall('Neo.Runtime.Notify', 'event', 0, 'foo', true);
    `);
  });
});
