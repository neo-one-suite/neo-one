// tslint:disable no-object-mutation no-array-mutation
import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
import * as path from 'path';
import prettier from 'prettier';
import ts from 'typescript';

const run = () => {
  const tsConfigFilePath = path.resolve(appRootDir.get(), 'tsconfig.json');
  const res = ts.readConfigFile(tsConfigFilePath, (value) => fs.readFileSync(value, 'utf8'));
  const parseConfigHost = {
    fileExists: fs.existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: true,
  };
  const parsed = ts.parseJsonConfigFileContent(res.config, parseConfigHost, path.dirname(tsConfigFilePath));

  const typescriptFile = path.resolve(appRootDir.get(), 'node_modules', 'typescript', 'lib', 'typescript.d.ts');
  const program = ts.createProgram({
    options: parsed.options,
    rootNames: [typescriptFile],
  });
  ts.getPreEmitDiagnostics(program);

  const sourceFile = program.getSourceFile(typescriptFile);
  if (sourceFile === undefined) {
    throw new Error('Could not find typescript.d.ts');
  }

  const interfaceNameToInterface: { [key: string]: ts.InterfaceDeclaration } = {};
  const interfaceToDirectParents: { [key: string]: string[] } = {};
  const addParent = (node: ts.InterfaceDeclaration, identifier: ts.Identifier) => {
    interfaceToDirectParents[node.name.getText()].push(identifier.getText());
  };
  function walk(child: ts.Node): void {
    if (ts.isInterfaceDeclaration(child)) {
      if ((interfaceNameToInterface[child.name.getText()] as ts.InterfaceDeclaration | undefined) === undefined) {
        interfaceNameToInterface[child.name.getText()] = child;
      } else if (child.members.some((member) => member.name !== undefined && member.name.getText() === 'kind')) {
        interfaceNameToInterface[child.name.getText()] = child;
      }

      if ((interfaceToDirectParents[child.name.getText()] as ReadonlyArray<string> | undefined) === undefined) {
        interfaceToDirectParents[child.name.getText()] = [];
      }

      const clauses = child.heritageClauses;
      if (clauses !== undefined) {
        clauses.forEach((clause) => {
          clause.types.forEach((type) => {
            if (ts.isIdentifier(type.expression)) {
              addParent(child, type.expression);
            }
          });
        });
      }
    }

    child.forEachChild(walk);
  }
  sourceFile.forEachChild(walk);

  const interfaceToAllParents: { [key: string]: string[] } = {};
  function processInterface(name: string): void {
    if ((interfaceToAllParents[name] as string[] | undefined) === undefined) {
      interfaceToAllParents[name] = [];
      if ((interfaceToDirectParents[name] as string[] | undefined) === undefined) {
        return;
      }
      interfaceToAllParents[name] = [...interfaceToDirectParents[name]];
      interfaceToDirectParents[name].forEach((parentName) => {
        processInterface(parentName);
        interfaceToAllParents[name].push(...interfaceToAllParents[parentName]);
      });
      interfaceToAllParents[name] = [...new Set(interfaceToAllParents[name])];
    }
  }
  Object.keys(interfaceToDirectParents).forEach((name) => {
    processInterface(name);
  });

  const interfaceToAllChildren: { [key: string]: string[] } = {};
  Object.keys(interfaceNameToInterface).forEach((name) => {
    if ((interfaceToAllChildren[name] as string[] | undefined) === undefined) {
      interfaceToAllChildren[name] = [];
    }

    if ((interfaceToAllParents[name] as string[] | undefined) !== undefined) {
      interfaceToAllParents[name].forEach((parent) => {
        if ((interfaceToAllChildren[parent] as string[] | undefined) === undefined) {
          interfaceToAllChildren[parent] = [];
        }
        interfaceToAllChildren[parent].push(name);
      });
    }
  });

  const getSyntaxKinds = (name: string) => {
    const decl = interfaceNameToInterface[name];
    const syntaxKindMember = decl.members.find(
      (member) => member.name !== undefined && member.name.getText() === 'kind',
    );

    if (
      syntaxKindMember !== undefined &&
      ts.isPropertySignature(syntaxKindMember) &&
      syntaxKindMember.type !== undefined
    ) {
      const typeText = syntaxKindMember.type.getText();
      if (typeText.startsWith('SyntaxKind')) {
        return typeText.split(' | ').map((value) => `ts.${value}`);
      }
    }

    return [];
  };

  const nodeChildren = new Set(interfaceToAllChildren.Node);
  const text = sourceFile.getText();
  const interfacesToSyntaxKinds = Object.entries(interfaceToAllChildren)
    .filter(([name]) => nodeChildren.has(name))
    // tslint:disable-next-line no-any
    .filter(([name]) => !text.includes(`is${name}(`))
    .map<[string, string[]]>(([name, children]) => {
      const syntaxKinds =
        children.length === 0
          ? getSyntaxKinds(name)
          : children.reduce<string[]>((acc, value) => acc.concat(getSyntaxKinds(value)), []);

      return [name, [...new Set(syntaxKinds)]];
    });

  const getName = (name: string) => {
    switch (name) {
      case 'ObjectLiteralExpressionBase':
        return 'ObjectLiteralExpressionBase<any>';
      default:
        return name;
    }
  };

  const createFunction = (name: string, syntaxKinds: string[]) => `
export function is${name}(node: ts.Node): node is ts.${getName(name)} {
  switch (node.kind) {
    ${syntaxKinds.map((kind) => `case ${kind}:`).join('\n    ')}
      return true;
    default:
      return false;
  }
}
`;

  const output = `// tslint:disable
import ts from 'typescript';

${interfacesToSyntaxKinds
  // tslint:disable-next-line no-unused
  .filter(([_name, syntaxKinds]) => syntaxKinds.length > 0)
  .map(([name, syntaxKinds]) => createFunction(name, syntaxKinds))
  .join('')}
`;

  const outputFile = path.resolve(appRootDir.get(), 'packages', 'neo-one-ts-utils', 'src', 'guards.ts');
  fs.writeFileSync(
    outputFile,
    prettier.format(output, {
      arrowParens: 'always',
      parser: 'typescript',
      printWidth: 120,
      singleQuote: true,
      trailingComma: 'all',
    }),
  );
};

run();
