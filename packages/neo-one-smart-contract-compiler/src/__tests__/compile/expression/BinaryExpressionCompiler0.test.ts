import { helpers } from '../../../__data__';

describe('BinaryExpressionCompiler', () => {
  test('x = 3', async () => {
    await helpers.executeString(`
      let x = 3;
      if (x !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('x += 3 [PlusEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      if ((x += 3) !== 6) {
        throw 'Failure';
      }
    `);
  });

  test('x -= 3 [MinusEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x -= 3;
      if (x !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('x *= 3 [AsteriskEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x *= 3;
      if (x !== 9) {
        throw 'Failure';
      }
    `);
  });

  test('x /= 3 [SlashEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x /= 3;
      if (x !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('x **= 3 [AsteriskAsteriskEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x **= 3;
      if (x !== 27) {
        console.log(x);
        throw 'Failure';
      }
    `);
  });

  test('3 % 3 === 0 [PercentToken]', async () => {
    await helpers.executeString(`
      if (3 % 3 !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('4 % 3 === 1 [PercentToken]', async () => {
    await helpers.executeString(`
      if (4 % 3 !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('x %= 3 [PercentEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x %= 3;
      if (x !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('x &= 0b001 [AmpersandEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x &= 0b001;
      if (x !== 0b001) {
        throw 'Failure';
      }
    `);
  });

  test('x |= 0b100 [BarEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x |= 0b100;
      if (x !== 0b111) {
        throw 'Failure';
      }
    `);
  });

  test('x ^= 0b100 [CaretEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x ^= 0b110;
      if (x !== 0b101) {
        throw 'Failure';
      }
    `);
  });

  test('x <<= 1 [LessThanLessThanEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x <<= 1;
      if (x !== 6) {
        throw 'Failure';
      }
    `);
  });

  test('x >>= 1 [GreaterThanGreaterThanEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x >>= 1;
      if (x !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('1 * 2 == 2 [AsteriskToken]', async () => {
    await helpers.executeString(`
      if (1 * 2 !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('4 / 2 == 2 [SlashToken]', async () => {
    await helpers.executeString(`
      if (4 / 2 !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('4 % 3 == 1 [PercentToken]', async () => {
    await helpers.executeString(`
      if (4 % 3 !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('1 + 2 === 3 [PlusToken:binaryNumeric]', async () => {
    await helpers.executeString(`
      if (1 + 2 !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('"1" + "2" === "12" [PlusToken:StringConcatenation:StrBoth]', async () => {
    await helpers.executeString(`
      if ('1' + '2' !== '12') {
        throw 'Failure';
      }
    `);
  });

  test('1 + "3" === "13" [PlusToken:StringConcatenation:IntLeftStrRight]', async () => {
    await helpers.executeString(`
      if (1 + '3' !== '13') {
        throw 'Failure';
      }
    `);
  });

  test('12 + "3" === "13" [PlusToken:StringConcatenation:IntLeftStrRight]', async () => {
    await helpers.executeString(`
      if (12 + '3' !== '123') {
        throw 'Failure';
      }
    `);
  });

  test('"4" + 21 === "421" [PlusToken:StringConcatenation:StrLeftIntRight]', async () => {
    await helpers.executeString(`
      if ('4' + 21 !== '421') {
        throw 'Failure';
      }
    `);
  });

  test('"4" + 21 === "421" [PlusToken:StringConcatenation:Unknown]', async () => {
    await helpers.executeString(
      `
      const x: string | number = 21 as string | number;
      const y: any = '4' as any;
      const z: string = y + x;
      if (z !== '421') {
        console.log(z);
        throw 'Failure';
      }
    `,
      { ignoreWarnings: true },
    );
  });

  test('1 - 2 = -1 [MinusToken]', async () => {
    await helpers.executeString(`
      if (1 - 2 !== -1) {
        throw 'Failure';
      }
    `);
  });

  test('(224 >>> 2) == 56 [GreaterThanGreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((224 >>> 2) !== 56) {
        throw 'Failure';
      }
    `);
  });

  test('(224 >>>= 2) == 56 [GreaterThanGreaterThanGreaterThanEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 224;
      x >>>= 2;
      if (x !== 56) {
        throw 'Failure';
      }
    `);
  });

  test('(128 >> 2) == 32 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((128 >> 2) !== 32) {
        throw 'Failure';
      }
    `);
  });

  test('(-234 >> 2) == -59 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((-234 >> 2) !== -59) {
        throw 'Failure';
      }
    `);
  });

  test('(256 >> -2) == 63 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((256 >> -2) !== 63) {
        throw 'Failure';
      }
    `);
  });

  test('(-256 >> -2) == -64 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((-256 >> -2) !== -64) {
        throw 'Failure';
      }
    `);
  });

  test('(32 << 2) == 128 [LessThanLessThanToken]', async () => {
    await helpers.executeString(`
      if ((32 << 2) !== 128) {
        throw 'Failure';
      }
    `);
  });

  test('(-24 << 2) == 96 [LessThanLessThanToken]', async () => {
    await helpers.executeString(`
      if ((-24 << 2) !== -96)  {
        throw 'Failure';
      }
    `);
  });
});
