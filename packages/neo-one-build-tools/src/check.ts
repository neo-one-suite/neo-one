// tslint:disable: no-console
import fs from 'fs';
// tslint:disable-next-line: match-default-export-name
import glob from 'glob';
import path from 'path';
import ts from 'typescript';
import { packages } from './prepare';
import { getImportDeclarations, getModuleSpecifier } from './tsUtils';

const packagePath = path.resolve(__dirname, '..', '..');

const getDevTypeDeps = (pathIn: string) => {
  const devDeps = JSON.parse(fs.readFileSync(pathIn, 'utf-8')).devDependencies;

  return devDeps === null || devDeps === undefined ? {} : devDeps;
};

const getTypeDevDepsFromPackage = (pkgPath: string) => {
  const devDeps = getDevTypeDeps(path.resolve(pkgPath, 'package.json'));
  const prefix = '@types/';

  return Object.keys(devDeps).map((key) => (key.startsWith(prefix) ? key.slice(prefix.length) : key));
};

// tslint:disable-next-line: no-let
let packagesLeft = packages.length;

const run = async (): Promise<readonly [string, number]> => {
  const result = await Promise.all<boolean>(
    packages.map(async (pkg: string) => {
      const pkgPath = path.resolve(packagePath, pkg);
      const typeDepsSet = new Set(getTypeDevDepsFromPackage(pkgPath));
      const distPath = path.resolve(pkgPath, 'dist', 'cjs');
      const allDecFiles = await new Promise<readonly string[]>((resolve, reject) =>
        glob(path.join(distPath, '**', '*.d.ts'), (err, found) => {
          if (err) {
            reject(err);
          } else {
            resolve(found);
          }
        }),
      );
      const warningSet = new Set();
      let resultOut = false;
      allDecFiles.forEach((file) => {
        const sourceFile = ts.createProgram([file], {}).getSourceFile(file);
        if (!sourceFile) {
          throw new Error(`File undefined: ${file}`);
        }
        const importDeclarationNodes = getImportDeclarations(sourceFile);
        importDeclarationNodes.forEach((node) => {
          const moduleSpec = getModuleSpecifier(node);
          const text = moduleSpec === undefined ? undefined : moduleSpec.text;
          if (text !== undefined && typeDepsSet.has(text) && !warningSet.has(text)) {
            console.warn(`\nFound missing @type dependency in package ${pkg}: ${text}\n`);
            resultOut = true;
            warningSet.add(text);
          }
        });
      });
      packagesLeft -= 1;
      console.log(`${packagesLeft} package${packagesLeft === 1 ? '' : 's'} remaining. Done scanning ${pkg}.`);

      return resultOut;
    }),
  );

  return result.includes(true) ? ['Found missing @types dependencies', 1] : ['Done', 0];
};

run()
  .then(([message, exitCode]) => {
    console.log(message);
    process.exit(exitCode);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
