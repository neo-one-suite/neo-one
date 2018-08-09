import { helpers } from '../../../__data__';

describe('TaggedTemplateExpressionCompiler', () => {
  test('f`hello 21`', async () => {
    await helpers.executeString(
      `
      const f = (literals: TemplateStringsArray, ...placeholders: (string | number)[]) => {
        let out = '';
        literals.forEach((literal, idx) => {
          out += literal;
          if (idx !== placeholders.length) {
            out += placeholders[idx];
          }
        });

        return out;
      }

      const x = 'hello';
      const y = 21;
      f\`\${x} \${y}\`;
      if (f\`\${x} \${y}\` !== 'hello 21') {
        throw 'Failure';
      }

      f\`hello 21\`;
      if (f\`hello 21\` !== 'hello 21') {
        throw 'Failure';
      }
    `,
      { ignoreWarnings: true },
    );
  });
});
