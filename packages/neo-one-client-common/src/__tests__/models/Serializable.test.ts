import { createSerializeWire } from '../../';

test('Serializable', () => {
  const serializable = createSerializeWire((writer) => {
    writer.writeArray([], () => {
      //
    });
  });

  expect(serializable()).toEqual(Buffer.from([0x00]));
});
