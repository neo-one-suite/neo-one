import { BinaryWriter } from '../..';
import { WitnessModel } from '../../models';

const invocation = Buffer.from([0x81]);
const verification = Buffer.from([0x50]);

describe('Witness Model', () => {
  test('SerializeWireBase', () => {
    const testWriter = new BinaryWriter();
    const witnessModel = new WitnessModel({
      invocation,
      verification,
    });

    witnessModel.serializeWireBase(testWriter);

    expect(testWriter.toBuffer().length).toEqual(4);
  });
});
