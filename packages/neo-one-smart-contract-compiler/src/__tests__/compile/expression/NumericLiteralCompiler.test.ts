import { helpers } from '../../../__data__';

describe('NumericLiteralCompiler', () => {
  test('Assigning decimal, binary, hex & octal', async () => {
    await helpers.executeString(`
      const sevenPointSixBillion = 7_600_000_000;
      const binaryByteMasking = 0b1111_1111;
      const grouping_hex = 0xFF_EF_D5;
      const anOctal: number = 0o744;

      if (sevenPointSixBillion !== 7600000000) {
        throw 'Failure';
      }

      if (grouping_hex !== 16773077) {
        throw 'Failure';
      }

      if (binaryByteMasking !== 255) {
        throw 'Failure';
      }

      if (anOctal !== 484) {
        throw 'Failure';
      }
    `);
  });

  test('To the E', async () => {
    await helpers.executeString(`
      const toTheE = 123e5;
      const toTheNegativeE = 123e-5;

      if (toTheE !== 12300000 ) {
        throw 'Failure';
      }

      if (toTheNegativeE !== 0.00123 ) {
        throw 'Failure';
      }
    `);
  });
});
