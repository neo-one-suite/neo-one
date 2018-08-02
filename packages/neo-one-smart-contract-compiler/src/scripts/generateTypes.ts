// tslint:disable no-import-side-effect
import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
import { format } from 'prettier';
import { BLOCKCHAIN_INTERFACES, SYSCALLS, TYPE_ALIASES } from '../compile/syscalls';
import { pathResolve } from '../utils';

const run = async () => {
  const types = TYPE_ALIASES.map((alias) => `${alias.toDeclaration()}`).join('\n');
  const interfaces = BLOCKCHAIN_INTERFACES.map(
    (name) =>
      `interface ${name} {
    __brand: '${name}';
  }`,
  ).join('\n');

  const syscalls = Object.values(SYSCALLS)
    .map((syscall) => `declare ${syscall.toDeclaration()}`)
    .join('\n');

  const content = `// tslint:disable
${types}
${interfaces}
${syscalls}
`;
  const filePath = pathResolve(appRootDir.get(), 'packages', 'neo-one-smart-contract', 'src', 'sc.d.ts');
  await fs.writeFile(
    filePath,
    format(content, {
      arrowParens: 'always',
      parser: 'typescript',
      printWidth: 120,
      singleQuote: true,
      trailingComma: 'all',
    }),
  );
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // tslint:disable-next-line
    console.error(error);
    process.exit(1);
  });
