import { helpers } from '../../../__data__';

describe('VariableDeclarationListCompiler', () => {
  test('binds let variables', async () => {
    await helpers.executeString(`
      let x = 0;
      if (x !== 0) {
        throw 'Failure';
      }

      x = x + 1;
      if (x !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('Illegal Assignment: once defined with const, X should not be re-assignable.', async () => {
    await helpers.compileString(
      `
      const x = 0;
      x = 3;
    `,
      { type: 'error' },
    );
  });

  test('binds const variables', async () => {
    await helpers.executeString(`
      const x = 3;

      if (x !== 3) {
        throw 'Failure';
      }

      const y = x + 1;
      if (y !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('binds variables value to output of function', async () => {
    await helpers.executeString(`
      let i = 3;
      function fn(){return ++i};
      const y = fn();

      if (y !== 4) {
        throw 'Failure';
      }
    `);
  });

  test.skip('binds function to variable & function output to variable', async () => {
    await helpers.executeString(`
      let i = 3;
      const fn = function() {
        return ++i;
      };

      if (fn() !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('binds function return value to variable', async () => {
    await helpers.executeString(`
      let i = 2;
      function fn(){
        return ++i;
      }
      const y = fn();
      if (y !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('binds variable of non US charset', async () => {
    await helpers.executeString(`
      let Früh = 2;
      if (Früh !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('Assignment with incongruent typing', async () => {
    await helpers.compileString(
      `
      // error TS2322: Type '"3"' is not assignable to type 'number'.
       const x: number = '3';

    `,
      { type: 'error' },
    );
  });

  test.skip('binds array composed of spread array to variable', async () => {
    await helpers.executeString(`
      var i = [1,2,3,4,5];
      let j = [...i, 10, 20, 30];
      if ((j[3] + i[6]) !== 24) {
        throw 'Failure';
      }
      `);
  });

  test.skip('binds object composed of spread object to variable', async () => {
    await helpers.executeString(`
      var i = {attr: 'value'};
      var o = {...i, attr2: 'value2'};
      if (o.attr !== "value" || o.attr2 != "value2") {
        throw 'Failure';
      }
      `);
  });

  test.skip('binds variable with string template', async () => {
    await helpers.executeString(
      " \
      let i = [1,2,3,4,5]; \
      let j = `${i[1]} times`; \
      if (j !== '2 times') { \
        throw 'Failure'; \
      } \
      ",
    );
  });

  test('binds variable result of addition', async () => {
    await helpers.executeString(`
      let i = [1,2,3,4,5];
      let j = i[0] + i[4] + 4;
      if (j !== 10) {
        throw 'Failure';
      }
      `);
  });

  test.skip('binds variable with concat of string and number', async () => {
    await helpers.executeString(`
      let i = 'thing ' + 123;
      if (i !== "thing 123") {
        throw 'Failure';
      }
      `);
  });

  test.skip('declare n without assignment using const, should not be empty string', async () => {
    await helpers.executeString(`
      const n; // should be syntax error.
      if (n === '') {
        throw 'Failure';
      }
      `);
  });

  test.skip('declare n without assignment using let and var, should be undefined', async () => {
    await helpers.executeString(`
      let a;
      var b;
      if (a !== undefined || b !== undefined) {
          throw 'Failure';
      }
      `);
  });

  test('bind variable with null', async () => {
    await helpers.executeString(`
      let n = null;
      if (n !== null) {
        throw 'Failure';
      }
      `);
  });

  test('bind variable with return value of an anonymous function', async () => {
    await helpers.executeString(`
      let n = (()=>123)();
      if (n !== 123) {
        throw 'Failure';
      }
      `);
  });

  test('bind variable with undefined', async () => {
    await helpers.executeString(`
      let n = undefined;
      if (n !== undefined) {
        throw 'Failure';
      }
      `);
  });

  test('binds variables with pre and post increments and decrements', async () => {
    await helpers.executeString(`
      let h = 5;
      let i = 1;  // 1
      let j = i++; // 1
      let k = ++i; // 3
      let l = h--; // 5
      let o = --h; // 3
      let p = h + i + j + k + l  + o;
      if (p !== 18) {
        throw 'Failure';
      }
      `);
  });

  test('binds addition result of object member, array entry and integer to variable', async () => {
    await helpers.executeString(`
    let i = [1,2,3,4,5];
    let o = {bar:1,baz:2,fiz:3,fuz:4,far:5};
    let j = o.bar + i[3] + 4;
      if (j !== 9) {
        throw 'Failure';
      }
      `);
  });

  test('binds array variable', async () => {
    await helpers.executeString(`
      let i = [1,2,3,4,5];

      if ((i[0] + i[2]) !== 4) {
        throw 'Failure';
      }

      `);
  });
});
