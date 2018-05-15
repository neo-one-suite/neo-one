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

  test('Neo.Runtime.Serialize/Deserialize generic', async () => {
    await helpers.executeString(`
      class Serializer<V> {
        public serialize(value: V): Buffer {
          return syscall('Neo.Runtime.Serialize', value);
        }

        public deserialize(value: Buffer): V {
          return (syscall('Neo.Runtime.Deserialize', value) as V);
        }
      }

      const serializer: Array<Array<number | boolean>> = new Serializer();

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
    `);
  });

  test('Neo.Runtime.Notify', async () => {
    await helpers.executeString(`
      syscall('Neo.Runtime.Notify', 'event', 0, 'foo', true);
    `);
  });
});
