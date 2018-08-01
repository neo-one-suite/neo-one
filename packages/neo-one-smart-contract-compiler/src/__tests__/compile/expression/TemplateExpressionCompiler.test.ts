import { helpers } from '../../../__data__';

describe('TemplateExpressionCompiler', () => {
  test('`hello 21`', async () => {
    await helpers.executeString(`
      const x = 'hello';
      const y = 21;
      \`\${x} \${y}\`;
      if (\`\${x} \${y}\` !== 'hello 21') {
        throw 'Failure';
      }
    `);
  });
});
