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

  test('x += 3', async () => {
    await helpers.executeString(`
let x = 3;
if ((x += 3) !== 6) {
  throw 'Failure';
}
    `);
  });

  test('x -= 3', async () => {
    await helpers.executeString(`
let x = 3;
x -= 3;
if (x !== 0) {
  throw 'Failure';
}
    `);
  });

  test('x *= 3', async () => {
    await helpers.executeString(`
let x = 3;
x *= 3;
if (x !== 9) {
  throw 'Failure';
}
    `);
  });

  test('x /= 3', async () => {
    await helpers.executeString(`
let x = 3;
x /= 3;
if (x !== 1) {
  throw 'Failure';
}
    `);
  });

  test.skip('x **= 3', async () => {
    await helpers.executeString(`
  let x = 3;
  x **= 3;
  if (x !== 27) {
    throw 'Failure';
  }
      `);
  });

  test('3 % 3 === 0', async () => {
    await helpers.executeString(`
if (3 % 3 !== 0) {
  throw 'Failure';
}
    `);
  });

  test('4 % 3 === 1', async () => {
    await helpers.executeString(`
if (4 % 3 !== 1) {
  throw 'Failure';
}
    `);
  });

  test('x %= 3', async () => {
    await helpers.executeString(`
let x = 3;
x %= 3;
if (x !== 0) {
  throw 'Failure';
}
    `);
  });

  test('x &= 0b001', async () => {
    await helpers.executeString(`
let x = 0b011;
x &= 0b001;
if (x !== 0b001) {
  throw 'Failure';
}
    `);
  });

  test('x |= 0b100', async () => {
    await helpers.executeString(`
let x = 0b011;
x |= 0b100;
if (x !== 0b111) {
  throw 'Failure';
}
    `);
  });

  test('x ^= 0b100', async () => {
    await helpers.executeString(`
let x = 0b011;
x ^= 0b110;
if (x !== 0b101) {
  throw 'Failure';
}
    `);
  });

  test.skip('x <<= 1', async () => {
    await helpers.executeString(`
  let x = 0b011;
  x <<= 1;
  if (x !== 0b110) {
    throw 'Failure';
  }
      `);
  });

  test.skip('x >>= 1', async () => {
    await helpers.executeString(`
  let x = 0b011;
  x >>= 1;
  if (x !== 0b001) {
    throw 'Failure';
  }
      `);
  });

  test('1 * 2 = 2', async () => {
    await helpers.executeString(`
if (1 * 2 !== 2) {
  throw 'Failure';
}
    `);
  });

  test('4 / 2 = 2', async () => {
    await helpers.executeString(`
if (4 / 2 !== 2) {
  throw 'Failure';
}
    `);
  });

  test('4 % 3 = 1', async () => {
    await helpers.executeString(`
if (4 % 3 !== 1) {
  throw 'Failure';
}
    `);
  });

  test('1 + 2 === 3', async () => {
    await helpers.executeString(`
if (1 + 2 !== 3) {
  throw 'Failure';
}
    `);
  });

  test('"1" + "2" === "12"', async () => {
    await helpers.executeString(`
if ('1' + '2' !== '12') {
  throw 'Failure';
}
    `);
  });

  test('1 - 2 = -1', async () => {
    await helpers.executeString(`
if (1 - 2 !== -1) {
  throw 'Failure';
}
    `);
  });

  test('1 < 1', async () => {
    await helpers.executeString(`
if (1 < 1) {
  throw 'Failure';
}
    `);
  });

  test('!(1 < 2)', async () => {
    await helpers.executeString(`
if (!(1 < 2)) {
  throw 'Failure';
}
    `);
  });

  test('2 <= 1', async () => {
    await helpers.executeString(`
if (2 <= 1) {
  throw 'Failure';
}
    `);
  });

  test('!(2 <= 2)', async () => {
    await helpers.executeString(`
if (!(2 <= 2)) {
  throw 'Failure';
}
    `);
  });

  test('1 > 1', async () => {
    await helpers.executeString(`
if (1 > 1) {
  throw 'Failure';
}
    `);
  });

  test('!(2 > 1)', async () => {
    await helpers.executeString(`
if (!(2 > 1)) {
  throw 'Failure';
}
    `);
  });

  test('1 >= 2', async () => {
    await helpers.executeString(`
if (1 >= 2) {
  throw 'Failure';
}
    `);
  });

  test('!(2 >= 2)', async () => {
    await helpers.executeString(`
if (!(2 >= 2)) {
  throw 'Failure';
}
    `);
  });

  test('true && true', async () => {
    await helpers.executeString(`
if (!(true && true)) {
  throw 'Failure';
}
    `);
  });

  test('true && false', async () => {
    await helpers.executeString(`
if (true && false) {
  throw 'Failure';
}
    `);
  });

  test('false && true', async () => {
    await helpers.executeString(`
      if (false && true) {
        throw 'Failure';
      }
    `);
  });

  test('false && false', async () => {
    await helpers.executeString(`
      if (false && false) {
        throw 'Failure';
      }
    `);
  });

  test('false && short-circuit', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      if (false && fail()) {
        throw 'Failure';
      }
    `);
  });

  test('0 && true', async () => {
    await helpers.executeString(`
      if (!((0 && true) === 0)) {
        throw 'Failure';
      }
    `);
  });

  test('true && 1', async () => {
    await helpers.executeString(`
      if (!(true && 1 === 1)) {
        throw 'Failure';
      }
    `);
  });

  test('true || true', async () => {
    await helpers.executeString(`
      if (!(true || true)) {
        throw 'Failure';
      }
    `);
  });

  test('true || false', async () => {
    await helpers.executeString(`
      if (!(true || false)) {
        throw 'Failure';
      }
    `);
  });

  test('false || true', async () => {
    await helpers.executeString(`
      if (!(false || true)) {
        throw 'Failure';
      }
    `);
  });

  test('false || false', async () => {
    await helpers.executeString(`
      if (false || false) {
        throw 'Failure';
      }
    `);
  });

  test('true || short-circuit', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      if (!(true || fail())) {
        throw 'Failure';
      }
    `);
  });

  test('1 || 0', async () => {
    await helpers.executeString(`
      if (!(1 || 0 === 1)) {
        throw 'Failure';
      }
    `);
  });

  test('false || 0', async () => {
    await helpers.executeString(`
      if (!(false || 0 === 0)) {
        throw 'Failure';
      }
    `);
  });

  test('undefined || 0', async () => {
    await helpers.executeString(`
      if ((undefined || 0) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('null == undefined', async () => {
    await helpers.executeString(`
      if (!(null == undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('dog instanceof Animal [InstanceOfKeyword]', async () => {
    await helpers.executeString(`
    class Animal{};
    let dog = new Animal();
    if (!(dog instanceof Animal )) {
        throw 'Failure';
      }
    `);
  });
});
