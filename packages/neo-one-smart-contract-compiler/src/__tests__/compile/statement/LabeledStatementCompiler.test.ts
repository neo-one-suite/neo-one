import { helpers } from '../../../__data__';

describe('LabeledStatementCompiler', () => {
  test('simple', async () => {
    helpers.compileString(
      `
      loop1:
      for (let i = 0; i < 3; i++) {
         for (let j = 0; j < 3; j++) {
            if (i === 1 && j === 1) {
               continue loop1;
            }
         }
      }
    `,
      {
        type: 'error',
      },
    );
  });
});
