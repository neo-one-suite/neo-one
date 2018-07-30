import { helpers } from '../../../__data__';

describe('TryStatementCompiler', () => {
  test.skip('try catch error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      try {
        throw 'Failure';
      } catch (err) {
        error = err;
      }

      if (error === undefined) {
        throw 'Failure';
      }
    `);
  });

  test.skip('try catch no error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      try {

      } catch (err) {
        error = err;
      }

      if (error !== undefined) {
        throw 'Failure';
      }
    `);
  });

  test.skip('try finally error', async () => {
    await helpers.executeString(`
      let gotFinally = false;
      try {
        try {
          throw 'Hello World';
        } finally {
          gotFinally = true;
        }
      } catch (error) {
        // do nothing
      }

      if (!gotFinally) {
        throw 'Failure';
      }
    `);
  });

  test.skip('try finally no error', async () => {
    await helpers.executeString(`
      let gotFinally = false;
      try {
        // do nothing
      } finally {
        gotFinally = true;
      }

      if (!gotFinally) {
        throw 'Failure';
      }
    `);
  });

  test.skip('try catch finally error', async () => {
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

      if (error === undefined) {
        throw 'Failure';
      }

      if (!gotFinally) {
        throw 'Failure';
      }
    `);
  });

  test.skip('try catch finally no error', async () => {
    await helpers.executeString(`
      let error: string | undefined;
      let gotFinally = false;
      try {

      } catch (err) {
        error = err;
      } finally {
        gotFinally = true;
      }

      if (error !== undefined) {
        throw 'Failure';
      }

      if (!gotFinally) {
        throw 'Failure';
      }
    `);
  });
});
