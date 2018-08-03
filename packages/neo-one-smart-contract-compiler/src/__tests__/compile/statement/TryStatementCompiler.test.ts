import { helpers } from '../../../__data__';

describe('TryStatementCompiler', () => {
  test('try empty catch', async () => {
    await helpers.executeString(`
      let caught = false;
      try {
        throw 'Failure';
      } catch {
        caught = true;
      }

      assertEqual(caught, true);
    `);
  });

  test('try catch error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      try {
        throw 'Failure';
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'Failure');
    `);
  });

  test('try catch no error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      try {

      } catch (err) {
        error = err;
      }

      assertEqual(error, undefined);
    `);
  });

  test('try finally error', async () => {
    await helpers.executeString(`
      let err: string | undefined;
      let gotFinally = false;
      try {
        try {
          throw 'Hello World';
        } finally {
          gotFinally = true;
        }
      } catch (error) {
        err = error;
      }

      assertEqual(err, 'Hello World');
      assertEqual(gotFinally, true);
    `);
  });

  test('try finally no error', async () => {
    await helpers.executeString(`
      let gotFinally = false;
      try {
        // do nothing
      } finally {
        gotFinally = true;
      }

      assertEqual(gotFinally, true);
    `);
  });

  test('try catch finally error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      let gotFinally = false;
      try {
        throw 'Hello World';
      } catch (err) {
        error = err;
      } finally {
        gotFinally = true;
      }

      assertEqual(error, 'Hello World');
      assertEqual(gotFinally, true);
    `);
  });

  test('try catch finally no error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      let gotFinally = false;
      try {

      } catch (err) {
        error = err;
      } finally {
        gotFinally = true;
      }

      assertEqual(error, undefined);
      assertEqual(gotFinally, true);
    `);
  });

  test('try finally with break', async () => {
    await helpers.executeString(`
      let result: string | undefined;
      while (true) {
        try {
          break;
        } finally {
          result = 'yay';
        }
      }

      assertEqual(result, 'yay');
    `);
  });

  test('try finally with continue', async () => {
    await helpers.executeString(`
      let result: string | undefined;
      while (true) {
        try {
          continue;
        } finally {
          result = 'yay';
          break;
        }
      }

      assertEqual(result, 'yay');
    `);
  });
});
