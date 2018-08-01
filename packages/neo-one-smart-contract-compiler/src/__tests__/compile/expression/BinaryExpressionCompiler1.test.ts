import { helpers } from '../../../__data__';

describe('BinaryExpressionCompiler', () => {
  test('true || short-circuit [BarBarToken]', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      const x: boolean = true as boolean;
      if (!(x || fail())) {
        throw 'Failure';
      }
    `);
  });

  test('1 || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      const x: number = 1 || 0;
      if (!(x === 1)) {
        throw 'Failure';
      }
    `);
  });

  test('false || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      if (!(false || 0 === 0)) {
        throw 'Failure';
      }
    `);
  });

  test('undefined || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      if ((undefined || 0) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('!(true == false) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const x: boolean = true as boolean;
      if (x == false) {
        throw 'Failure';
      }
    `);
  });

  test('!(undefined == "a") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (undefined == "a") {
        throw 'Failure';
      }
    `);
  });

  test('!(0 == null) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (0 == null) {
        throw 'Failure';
      }
    `);
  });

  test('null == undefined [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(null == undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('!(true == undefined) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (true == undefined) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(false == "") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const a: boolean | string = false as boolean | string;
      const b: boolean | string = '' as boolean | string;
      if (!(a == b)) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(false == " ")  [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const a: boolean | string = false as boolean | string;
      const b: boolean | string = ' ' as boolean | string;
      if (!(a == b)) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!(false == "a") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const a: boolean | string = false as boolean | string;
      const b: boolean | string = 'a' as boolean | string;
      if (a == b) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(3 == "3") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const a: number | string = 3 as number | string;
      const b: number | string = '3' as number | string;

      if (!(a == b)) {
        throw 'Failure';
      }
    `);
  });

  test('!(null == true) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == true) {
        throw 'Failure';
      }
    `);
  });

  test('!(null == false) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == false) {
        throw 'Failure';
      }
    `);
  });

  test('null == undefined [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(null == undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('null !== true [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == true) {
        throw 'Failure';
      }
    `);
  });
});
