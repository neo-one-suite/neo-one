// tslint:disable ban-types
import { ABIEvent, ABIFunction, ABIParameter, ABIReturn, ContractParameterType } from '@neo-one/client';
import { ClassInstanceMemberType, tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { toABIReturn } from '../../utils';
import { declarations } from '../declaration';
import { NodeTranspiler } from '../NodeTranspiler';
import { Contract, TranspileResult } from '../types';
import { ContractIdentifier, InternalIdentifier, Transpiler } from './Transpiler';

const transpilers: ReadonlyArray<ReadonlyArray<new () => NodeTranspiler>> = [declarations];

type Transpilers = { [K in number]?: NodeTranspiler };

interface Switch {
  readonly statement: ts.IfStatement;
  readonly original: ts.Node;
}

const BYTE_ARRAY_RETURN: ABIReturn = { type: 'Buffer' };
const BOOLEAN_RETURN: ABIReturn = { type: 'Boolean' };
const PARAMETERS: ReadonlyArray<ContractParameterType> = ['String', 'Array'];
const RETURN_TYPE = 'Buffer';
const createDefaultContract = (name: string): Contract => ({
  parameters: PARAMETERS,
  returnType: RETURN_TYPE,
  name,
  codeVersion: '1.0',
  author: 'unknown',
  email: 'unknown',
  description: '',
  storage: true,
  dynamicInvoke: true,
  payable: true,
});

export class NEOTranspiler implements Transpiler {
  private readonly transpilers: Transpilers;
  private readonly scheduledTranspile = new Set<ts.Node>();
  // tslint:disable-next-line readonly-keyword
  private readonly mutableFileToInternalImports: { [filePath: string]: Set<InternalIdentifier> } = {};
  // tslint:disable-next-line readonly-keyword
  private readonly mutableFileToContractImports: { [filePath: string]: Set<ContractIdentifier> } = {};

  public constructor(public readonly context: Context, private readonly smartContract: ts.ClassDeclaration) {
    this.transpilers = transpilers
      .reduce<ReadonlyArray<new () => NodeTranspiler>>(
        (acc: ReadonlyArray<new () => NodeTranspiler>, kindCompilers: ReadonlyArray<new () => NodeTranspiler>) =>
          acc.concat(kindCompilers),
        [],
      )
      .reduce<Transpilers>((acc: Transpilers, kindCompilerClass: new () => NodeTranspiler) => {
        const kindCompiler = new kindCompilerClass();
        if (acc[kindCompiler.kind] !== undefined) {
          throw new Error(`Found duplicate compiler for kind ${kindCompiler.kind}`);
        }

        acc[kindCompiler.kind] = kindCompiler;

        return acc;
      }, {});
  }

  public process(): TranspileResult {
    const events = this.processEvents();
    const contract = this.processContract();
    const { functions, statements: addedStatements } = this.processSmartContract();

    const context: ts.TransformationContext = {
      getCompilerOptions: (): ts.CompilerOptions => this.context.program.getCompilerOptions(),
      startLexicalEnvironment: (): void => {
        // do nothing
      },
      suspendLexicalEnvironment: (): void => {
        // do nothing
      },
      resumeLexicalEnvironment: (): void => {
        // do nothing
      },
      endLexicalEnvironment: (): ts.Statement[] | undefined => undefined,
      hoistFunctionDeclaration: (): void => {
        // do nothing
      },
      hoistVariableDeclaration: (): void => {
        // do nothing
      },
      requestEmitHelper: (): void => {
        // do nothing
      },
      readEmitHelpers: (): ts.EmitHelper[] | undefined => undefined,
      enableSubstitution: (): void => {
        // do nothing
      },
      isSubstitutionEnabled: (): boolean => false,
      onSubstituteNode: (_hint, node) => node,
      enableEmitNotification: (): void => {
        // do nothing
      },
      isEmitNotificationEnabled: (): boolean => false,
      onEmitNode: (hint, node, emitCallback) => {
        emitCallback(hint, node);
      },
    };

    const fixedTypeNodes: Set<ts.Node> = new Set(this.getFixedTypeNodes());

    const visitOne = (node: ts.Node): ts.Node => {
      const transpiler = this.transpilers[node.kind];
      if (transpiler === undefined) {
        return node;
      }

      return transpiler.visitNode(this, node);
    };

    const contractSourceFile = tsUtils.node.getSourceFile(this.smartContract);
    const sourceFiles = _.fromPairs(
      this.context.program
        .getSourceFiles()
        .map<[string, { text: string; sourceMap: RawSourceMap }] | undefined>((sourceFile) => {
          if (!tsUtils.file.isDeclarationFile(sourceFile)) {
            function visit(node: ts.Node): ts.VisitResult<ts.Node> {
              if (fixedTypeNodes.has(node)) {
                return tsUtils.setOriginal(ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword), node);
              }

              const transformedNode = visitOne(node);

              return ts.visitEachChild(transformedNode, visit, context);
            }

            let transformedSourceFile = visit(sourceFile) as ts.SourceFile;

            if (sourceFile === contractSourceFile) {
              transformedSourceFile = tsUtils.setOriginal(
                ts.updateSourceFileNode(
                  transformedSourceFile,
                  transformedSourceFile.statements.concat(addedStatements),
                  transformedSourceFile.isDeclarationFile,
                  transformedSourceFile.referencedFiles,
                  transformedSourceFile.typeReferenceDirectives,
                  transformedSourceFile.hasNoDefaultLib,
                  transformedSourceFile.libReferenceDirectives,
                ),
                transformedSourceFile,
              );
            }

            transformedSourceFile = this.addImports(transformedSourceFile);

            const result = tsUtils.print(this.context.program, sourceFile, transformedSourceFile);

            return [tsUtils.file.getFilePath(sourceFile), result];
          }

          return undefined;
        })
        .filter(utils.notNull),
    );

    return {
      sourceFiles,
      abi: {
        functions,
        events: events.concat([
          {
            name: 'trace',
            parameters: [
              {
                type: 'Integer',
                name: 'line',
                decimals: 0,
              },
            ],
          },
          {
            name: 'error',
            parameters: [
              {
                type: 'Integer',
                name: 'line',
                decimals: 0,
              },
              {
                type: 'String',
                name: 'message',
              },
            ],
          },
          {
            name: 'console.log',
            parameters: [
              {
                type: 'Integer',
                name: 'line',
                decimals: 0,
              },
              {
                type: 'Buffer',
                name: 'args',
              },
            ],
          },
        ]),
      },
      contract,
    };
  }

  public scheduleTranspile(node: ts.Node): void {
    this.scheduledTranspile.add(node);
  }

  public isSmartContract(node: ts.ClassDeclaration): boolean {
    if (node === this.smartContract) {
      return true;
    }

    const isSmartContract = tsUtils.class_.getImplementsArray(node).some((implType) => {
      const testType = this.context.getType(tsUtils.expression.getExpression(implType));

      return testType !== undefined && this.context.builtins.isInterface(node, testType, 'SmartContract');
    });
    if (isSmartContract) {
      return true;
    }

    const baseClass = tsUtils.class_.getBaseClass(this.context.typeChecker, node);

    return baseClass !== undefined && this.isSmartContract(baseClass);
  }

  public getTypeText(node: ts.Node, type: ts.Type): string {
    return tsUtils.type_.getText(this.context.typeChecker, type, node);
  }

  public getInternalIdentifier(node: ts.Node, name: InternalIdentifier): string {
    const sourceFile = ts.isSourceFile(node) ? node : tsUtils.node.getSourceFile(node);
    const imports = this.mutableFileToInternalImports[tsUtils.file.getFilePath(sourceFile)] as
      | Set<InternalIdentifier>
      | undefined;
    if (imports === undefined) {
      this.mutableFileToInternalImports[tsUtils.file.getFilePath(sourceFile)] = new Set([name]);
    } else {
      imports.add(name);
    }

    return this.getInternalImportName(name);
  }

  public getContractIdentifier(node: ts.Node, name: ContractIdentifier): string {
    const sourceFile = ts.isSourceFile(node) ? node : tsUtils.node.getSourceFile(node);
    const imports = this.mutableFileToContractImports[tsUtils.file.getFilePath(sourceFile)] as
      | Set<ContractIdentifier>
      | undefined;
    if (imports === undefined) {
      this.mutableFileToContractImports[tsUtils.file.getFilePath(sourceFile)] = new Set([name]);
    } else {
      imports.add(name);
    }

    return this.getInternalImportName(name);
  }

  // tslint:disable-next-line no-any readonly-array
  public reportError(node: ts.Node, code: DiagnosticCode, message: DiagnosticMessage, ...args: any[]): void {
    this.context.reportError(node, code, message, ...args);
  }

  public reportUnsupported(node: ts.Node): void {
    this.context.reportUnsupported(node);
  }

  public getParamTypeNode(
    node: ts.ParameterDeclaration,
    type: ts.Type | undefined,
    typeNode: ts.TypeNode,
  ): ts.TypeNode {
    let finalTypeNode = this.getFinalTypeNode(node, type, typeNode);
    if (tsUtils.initializer.getInitializer(node) !== undefined) {
      finalTypeNode = ts.createUnionTypeNode([ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword), finalTypeNode]);
    }

    return finalTypeNode;
  }

  public getFinalTypeNode(node: ts.Node, type: ts.Type | undefined, typeNode: ts.TypeNode): ts.TypeNode {
    if (type !== undefined && this.context.builtins.isType(node, type, 'Fixed')) {
      return tsUtils.setOriginal(ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword), typeNode);
    }

    return tsUtils.markOriginal(typeNode);
  }

  private getFixedTypeNodes(): ReadonlyArray<ts.TypeReferenceNode> {
    const fixedSymbol = this.context.builtins.getTypeSymbol('Fixed');
    const decl = tsUtils.symbol.getDeclarations(fixedSymbol)[0];
    const nodes = tsUtils.reference.findReferencesAsNodes(this.context.program, this.context.languageService, decl);

    return nodes
      .map((identifier) => tsUtils.node.getParent(identifier))
      .filter(utils.notNull)
      .filter(ts.isTypeReferenceNode);
  }

  private getInternalImportName(name: InternalIdentifier | ContractIdentifier): string {
    return `__internal__${name}`;
  }

  private addImports(file: ts.SourceFile): ts.SourceFile {
    const importStatements: ReadonlyArray<ts.Statement> = [
      this.getModuleImport(
        this.mutableFileToInternalImports[tsUtils.file.getFilePath(file)],
        '@neo-one/smart-contract-internal',
      ),
      this.getModuleImport(
        this.mutableFileToContractImports[tsUtils.file.getFilePath(file)],
        '@neo-one/smart-contract',
      ),
    ].filter(utils.notNull);

    if (importStatements.length > 0) {
      return tsUtils.setOriginal(
        ts.updateSourceFileNode(
          file,
          importStatements.concat(file.statements),
          file.isDeclarationFile,
          file.referencedFiles,
          file.typeReferenceDirectives,
          file.hasNoDefaultLib,
          file.libReferenceDirectives,
        ),
        file,
      );
    }

    return file;
  }

  private getModuleImport(
    imports: Set<InternalIdentifier | ContractIdentifier> | undefined,
    moduleName: string,
  ): ts.ImportDeclaration | undefined {
    if (imports !== undefined && imports.size > 0) {
      const importSpecifiers = [...imports].map((foundImport) =>
        ts.createImportSpecifier(
          ts.createIdentifier(foundImport),
          // tslint:disable-next-line no-any
          ts.createIdentifier(this.getInternalImportName(foundImport)),
        ),
      );

      return ts.createImportDeclaration(
        undefined,
        undefined,
        ts.createImportClause(undefined, ts.createNamedImports(importSpecifiers)),
        ts.createStringLiteral(moduleName),
      );
    }

    return undefined;
  }

  private processEvents(): ReadonlyArray<ABIEvent> {
    const decl = tsUtils.symbol.getDeclarations(this.context.builtins.getValueSymbol('createEventNotifier'))[0];

    const calls = tsUtils.reference
      .findReferencesAsNodes(this.context.program, this.context.languageService, decl)
      .map((node) => {
        if (ts.isIdentifier(node)) {
          const parent = tsUtils.node.getParent(node);
          if (ts.isCallExpression(parent)) {
            return parent;
          }
        }

        return undefined;
      })
      .filter(utils.notNull);

    return calls.map((call) => this.toABIEvent(call)).filter(utils.notNull);
  }

  private toABIEvent(call: ts.CallExpression): ABIEvent | undefined {
    const callArguments = tsUtils.argumented.getArguments(call);
    const typeArguments = tsUtils.argumented.getTypeArguments(call);
    const nameArg = callArguments[0] as ts.Node | undefined;
    if (nameArg === undefined || !ts.isStringLiteral(nameArg)) {
      this.reportError(
        nameArg === undefined ? call : nameArg,
        DiagnosticCode.InvalidContractEvent,
        DiagnosticMessage.InvalidContractEventNameStringLiteral,
      );

      return undefined;
    }

    const name = tsUtils.literal.getLiteralValue(nameArg);
    const parameters = _.zip(callArguments.slice(1), typeArguments === undefined ? [] : typeArguments)
      .map(([paramNameArg, paramTypeNode]) => {
        if (paramNameArg === undefined || paramTypeNode === undefined) {
          this.reportError(
            call,
            DiagnosticCode.InvalidContractEvent,
            DiagnosticMessage.InvalidContractEventMissingType,
          );

          return undefined;
        }

        if (!ts.isStringLiteral(paramNameArg)) {
          this.reportError(
            paramNameArg,
            DiagnosticCode.InvalidContractEvent,
            DiagnosticMessage.InvalidContractEventArgStringLiteral,
          );

          return undefined;
        }

        const paramName = tsUtils.literal.getLiteralValue(paramNameArg);

        return this.toABIParameter(paramName, paramNameArg, this.context.getType(paramTypeNode));
      })
      .filter(utils.notNull);

    return { name, parameters };
  }

  private processSmartContract(): {
    readonly functions: ReadonlyArray<ABIFunction>;
    readonly statements: ReadonlyArray<ts.Statement>;
  } {
    const smartContractType = tsUtils.type_.getType(this.context.typeChecker, this.smartContract);
    let methods = tsUtils.type_
      .getProperties(smartContractType)
      .map((symbol) => this.processProperty(symbol))
      .reduce((acc, values) => acc.concat(values), []);
    const ctor = tsUtils.class_.getFirstConcreteConstructor(this.context.typeChecker, this.smartContract);
    if (ctor !== undefined) {
      const ctorType = this.context.getTypeOfSymbol(this.context.getSymbol(ctor.parent), ctor.parent);
      if (ctorType !== undefined) {
        methods = methods.concat(this.processMethodProperty('deploy', ctor, ctorType.getConstructSignatures(), false));
      }
    }

    const contractIdentifier = 'contract';
    const methodIdentifier = 'method';

    const processMethod = (
      parametered: ts.Node & { readonly parameters: ts.NodeArray<ts.ParameterDeclaration> },
      name: string,
      shouldReturn: boolean,
    ) => {
      let argsStatement: ts.Statement | undefined;
      let args: ReadonlyArray<ts.Expression> | undefined;
      if (tsUtils.parametered.getParameters(parametered).length > 0) {
        const argsTypes = tsUtils.parametered
          .getParameters(parametered)
          .map((param) => this.getParamTypeNode(param, this.context.getType(param), tsUtils.type_.getTypeNode(param)));
        const argsIdentifier = ts.createIdentifier('args');
        argsStatement = ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                argsIdentifier,
                undefined,
                ts.createCall(
                  ts.createIdentifier(this.getInternalIdentifier(parametered, 'getArgument')),
                  [ts.createTupleTypeNode(argsTypes)],
                  [ts.createNumericLiteral('1')],
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        );
        args = tsUtils.parametered
          .getParameters(parametered)
          .map((param, idx) => tsUtils.setOriginal(ts.createElementAccess(argsIdentifier, idx), param));
      }
      let call = ts.createCall(ts.createPropertyAccess(ts.createIdentifier(contractIdentifier), name), undefined, args);
      if (shouldReturn) {
        call = ts.createCall(ts.createIdentifier(this.getInternalIdentifier(parametered, 'doReturn')), undefined, [
          call,
        ]);
      }

      const callStatement = ts.createExpressionStatement(call);

      return tsUtils.setOriginalRecursive(
        argsStatement === undefined ? callStatement : ts.createBlock([argsStatement, callStatement]),
        parametered,
      );
    };

    const mutableVerifySwitches: Switch[] = [];
    const mutableApplicationSwitches: Switch[] = [];
    const mutableFunctions: ABIFunction[] = [];
    methods.forEach(([method, func]) => {
      const name = ts.isConstructorDeclaration(method)
        ? 'deploy'
        : tsUtils.guards.isParameterDeclaration(method)
          ? tsUtils.node.getNameOrThrow(method)
          : tsUtils.node.getName(method);

      if (name === 'properties') {
        return;
      }

      let methodStatement: ts.Statement;
      let condition = ts.createBinary(
        ts.createIdentifier(methodIdentifier),
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.createStringLiteral(name),
      );

      if (ts.isMethodDeclaration(method)) {
        const returnType = this.context.getType(method);
        const shouldReturn = returnType !== undefined && !tsUtils.type_.isVoidish(returnType);
        methodStatement = processMethod(method, name, shouldReturn);
      } else if (ts.isConstructorDeclaration(method)) {
        methodStatement = processMethod(method, name, true);
      } else if (
        ts.isGetAccessorDeclaration(method) ||
        ts.isPropertyDeclaration(method) ||
        tsUtils.guards.isParameterDeclaration(method)
      ) {
        methodStatement = ts.createExpressionStatement(
          ts.createCall(ts.createIdentifier(this.getInternalIdentifier(method, 'doReturn')), undefined, [
            tsUtils.modifier.isReadonly(method) && tsUtils.initializer.getInitializer(method) === undefined
              ? ts.createCall(
                  ts.createPropertyAccess(
                    ts.createIdentifier(contractIdentifier),
                    `get${name[0].toUpperCase()}${name.slice(1)}`,
                  ),
                  undefined,
                  [],
                )
              : ts.createPropertyAccess(ts.createIdentifier(contractIdentifier), name),
          ]),
        );
      } else {
        const param = tsUtils.parametered.getParameters(method)[0];

        condition = ts.createBinary(
          ts.createIdentifier(methodIdentifier),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.createStringLiteral(`set${name[0].toUpperCase()}${name.slice(1)}`),
        );
        methodStatement = ts.createExpressionStatement(
          ts.createBinary(
            ts.createPropertyAccess(ts.createIdentifier(contractIdentifier), name),
            ts.SyntaxKind.EqualsToken,
            ts.createElementAccess(
              ts.createParen(
                ts.createCall(
                  ts.createIdentifier(this.getInternalIdentifier(method, 'getArgument')),
                  [
                    ts.createTupleTypeNode([
                      this.getParamTypeNode(param, this.context.getType(param), tsUtils.type_.getTypeNode(param)),
                    ]),
                  ],
                  [ts.createNumericLiteral('1')],
                ),
              ),
              0,
            ),
          ),
        );
      }

      const methodSwitch = tsUtils.setOriginalRecursive(ts.createIf(condition, methodStatement), method);

      const value = { statement: methodSwitch, original: method };
      mutableApplicationSwitches.push(value);
      if (func.verify) {
        mutableVerifySwitches.push(value);
      }

      mutableFunctions.push(func);
    });

    const applicationFallback = tsUtils.setOriginalRecursive(
      ts.createThrow(ts.createNew(ts.createIdentifier('Error'), undefined, [ts.createStringLiteral('Unknown method')])),
      this.smartContract,
    );
    const verifyFallback = tsUtils.setOriginalRecursive(
      ts.createIf(
        ts.createPrefix(
          ts.SyntaxKind.ExclamationToken,
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier(this.getContractIdentifier(this.smartContract, 'Address')),
              'verifySender',
            ),
            undefined,
            [ts.createPropertyAccess(ts.createIdentifier(contractIdentifier), 'owner')],
          ),
        ),
        ts.createThrow(
          ts.createNew(ts.createIdentifier('Error'), undefined, [ts.createStringLiteral('Invalid witness')]),
        ),
      ),
      this.smartContract,
    );

    function makeIfElse(ifStatements: ReadonlyArray<Switch>, finalStatement: ts.Statement): ts.Statement {
      if (ifStatements.length === 0) {
        return finalStatement;
      }

      return tsUtils.setOriginal(
        ts.createIf(
          ifStatements[0].statement.expression,
          ifStatements[0].statement.thenStatement,
          makeIfElse(ifStatements.slice(1), finalStatement),
        ),
        ifStatements[0].original,
      );
    }

    const statements = [
      tsUtils.setOriginalRecursive(
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                contractIdentifier,
                undefined,
                ts.createNew(ts.createIdentifier(tsUtils.node.getNameOrThrow(this.smartContract)), undefined, []),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        this.smartContract,
      ),
      tsUtils.setOriginalRecursive(
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                methodIdentifier,
                undefined,
                ts.createCall(
                  ts.createIdentifier(this.getInternalIdentifier(this.smartContract, 'getArgument')),
                  [ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
                  [ts.createNumericLiteral('0')],
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        this.smartContract,
      ),
      tsUtils.setOriginalRecursive(
        ts.createIf(
          tsUtils.setOriginal(
            ts.createBinary(
              ts.createIdentifier(this.getInternalIdentifier(this.smartContract, 'trigger')),
              ts.SyntaxKind.EqualsEqualsEqualsToken,
              ts.createNumericLiteral(`${0x10}`),
            ),
            this.smartContract,
          ),
          makeIfElse(mutableApplicationSwitches, applicationFallback),
          ts.createIf(
            ts.createBinary(
              ts.createIdentifier(this.getInternalIdentifier(this.smartContract, 'trigger')),
              ts.SyntaxKind.EqualsEqualsEqualsToken,
              ts.createNumericLiteral(`${0x00}`),
            ),
            makeIfElse(mutableVerifySwitches, verifyFallback),
            ts.createThrow(
              ts.createNew(ts.createIdentifier('Error'), undefined, [ts.createStringLiteral('Unsupported trigger')]),
            ),
          ),
        ),
        this.smartContract,
      ),
    ];

    return { functions: mutableFunctions, statements };
  }

  private processContract(): Contract {
    const name = tsUtils.node.getNameOrThrow(this.smartContract);
    const defaultContract = createDefaultContract(name);

    const properties = tsUtils.type_.getProperty(
      tsUtils.type_.getType(this.context.typeChecker, this.smartContract),
      'properties',
    );

    if (properties === undefined) {
      this.reportError(
        this.smartContract,
        DiagnosticCode.InvalidContractProperties,
        DiagnosticMessage.InvalidContractPropertiesMissing,
      );

      return defaultContract;
    }

    const decls = tsUtils.symbol
      .getDeclarations(properties)
      .filter(ts.isPropertyDeclaration)
      .filter((prop) => tsUtils.initializer.getInitializer(prop) !== undefined);
    if (decls.length !== 1) {
      this.reportError(
        this.smartContract,
        DiagnosticCode.InvalidContractProperties,
        DiagnosticMessage.InvalidContractPropertiesInitializer,
      );

      return defaultContract;
    }

    const decl = decls[0];
    const initializer = tsUtils.initializer.getInitializerOrThrow(decl);

    if (!ts.isObjectLiteralExpression(initializer)) {
      this.reportError(
        this.smartContract,
        DiagnosticCode.InvalidContractProperties,
        DiagnosticMessage.InvalidContractPropertiesInitializer,
      );

      return defaultContract;
    }

    const contract: { [key: string]: string } = {};
    let payable = false;
    // tslint:disable-next-line no-loop-statement
    for (const property of tsUtils.object_.getProperties(initializer)) {
      if (!ts.isPropertyAssignment(property)) {
        this.reportError(
          property,
          DiagnosticCode.InvalidContractProperties,
          DiagnosticMessage.InvalidContractPropertiesInitializer,
        );

        return defaultContract;
      }

      const key = tsUtils.node.getName(property);
      const value = tsUtils.initializer.getInitializer(property);
      if (!ts.isLiteralExpression(value) && !tsUtils.guards.isBooleanLiteral(value)) {
        this.reportError(
          value,
          DiagnosticCode.InvalidContractProperties,
          DiagnosticMessage.InvalidContractPropertiesInitializer,
        );

        return defaultContract;
      }

      if (key === 'payable') {
        if (tsUtils.guards.isBooleanLiteral(value)) {
          payable = value.kind === ts.SyntaxKind.TrueKeyword;
        }
      } else if (ts.isLiteralExpression(value)) {
        // tslint:disable-next-line no-object-mutation
        contract[key] = tsUtils.literal.getLiteralValue(value);
      }
    }

    return {
      ...contract,
      name,
      parameters: PARAMETERS,
      returnType: RETURN_TYPE,
      dynamicInvoke: false,
      storage: true,
      payable,
      // tslint:disable-next-line no-any
    } as any;
  }

  private processProperty(
    symbol: ts.Symbol,
  ): ReadonlyArray<[ClassInstanceMemberType | ts.ConstructorDeclaration, ABIFunction]> {
    const decls = tsUtils.symbol
      .getDeclarations(symbol)
      .filter(
        (symbolDecl) =>
          !(ts.isMethodDeclaration(symbolDecl) || ts.isConstructorDeclaration(symbolDecl)) ||
          tsUtils.overload.isImplementation(symbolDecl),
      );
    if (
      !(
        decls.length === 1 ||
        (decls.length === 2 &&
          decls.some((accessor) => ts.isGetAccessorDeclaration(accessor)) &&
          decls.some((accessor) => ts.isSetAccessorDeclaration(accessor)))
      )
    ) {
      this.reportUnsupported(tsUtils.symbol.getDeclarations(symbol)[0]);

      return [];
    }
    const decl = decls[0];
    if (
      !(
        ts.isMethodDeclaration(decl) ||
        ts.isPropertyDeclaration(decl) ||
        ts.isGetAccessorDeclaration(decl) ||
        ts.isSetAccessorDeclaration(decl) ||
        ts.isParameterPropertyDeclaration(decl)
      )
    ) {
      return [];
    }

    const name = symbol.getName();
    const type = this.context.getTypeOfSymbol(symbol, decl);
    if (type === undefined) {
      return [];
    }

    if (!tsUtils.modifier.isPublic(decl)) {
      return [];
    }

    if (ts.isGetAccessorDeclaration(decl) || ts.isSetAccessorDeclaration(decl)) {
      const getDecl = ts.isGetAccessorDeclaration(decl) ? decl : tsUtils.accessor.getGetAccessor(decl);
      const setDecl = ts.isSetAccessorDeclaration(decl) ? decl : tsUtils.accessor.getSetAccessor(decl);
      const mutableResult: Array<[ClassInstanceMemberType, ABIFunction]> = [];
      if (getDecl !== undefined) {
        const retType = toABIReturn(this.context, getDecl, type);
        mutableResult.push([
          getDecl,
          {
            name,
            constant: true,
            verify: this.hasVerify(getDecl),
            returnType:
              retType === undefined
                ? {
                    type: 'Buffer',
                  }
                : retType,
          },
        ]);
      }

      if (setDecl !== undefined) {
        const retType = toABIReturn(this.context, setDecl, type);
        mutableResult.push([
          setDecl,
          {
            name,
            constant: false,
            verify: this.hasVerify(setDecl),
            parameters: [
              {
                name: tsUtils.node.getNameOrThrow(tsUtils.parametered.getParameters(setDecl)[0]),
                ...(retType === undefined
                  ? {
                      type: 'Buffer',
                    }
                  : retType),
              },
            ],
            returnType: { type: 'Void' },
          },
        ]);
      }

      return mutableResult;
    }

    const verify = this.hasVerify(decl);
    if (ts.isMethodDeclaration(decl)) {
      return this.processMethodProperty(name, decl, type.getCallSignatures(), verify);
    }

    const returnType = toABIReturn(this.context, decl, type);
    const func = {
      name,
      constant: true,
      verify,
      returnType: returnType === undefined ? BYTE_ARRAY_RETURN : returnType,
    };

    return [[decl, func]];
  }

  private processMethodProperty(
    name: string,
    decl: ts.ConstructorDeclaration | ts.MethodDeclaration,
    callSignatures: ReadonlyArray<ts.Signature>,
    verify: boolean,
  ): ReadonlyArray<[ClassInstanceMemberType | ts.ConstructorDeclaration, ABIFunction]> {
    if (callSignatures.length !== 1) {
      this.reportError(
        decl,
        DiagnosticCode.InvalidContractMethod,
        DiagnosticMessage.InvalidContractMethodMultipleSignatures,
      );

      return [];
    }
    const callSignature = callSignatures[0];

    const parameters = callSignature
      .getParameters()
      .map((parameter) => this.paramToABIParameter(parameter))
      .filter(utils.notNull);
    const currentReturnType = ts.isConstructorDeclaration(decl)
      ? BOOLEAN_RETURN
      : toABIReturn(this.context, decl, callSignature.getReturnType());
    const constant = this.hasDecorator(decl, 'constant');
    const currentFunc = {
      name,
      constant,
      verify,
      parameters,
      returnType: currentReturnType === undefined ? BYTE_ARRAY_RETURN : currentReturnType,
    };

    return [[decl, currentFunc]];
  }

  private hasVerify(decl: ClassInstanceMemberType | ts.ConstructorDeclaration): boolean {
    return this.hasDecorator(decl, 'verify');
  }

  private hasDecorator(
    decl: ClassInstanceMemberType | ts.ConstructorDeclaration,
    name: 'verify' | 'constant',
  ): boolean {
    const decorators = tsUtils.decoratable.getDecorators(decl);

    return decorators === undefined ? false : decorators.some((decorator) => this.isDecorator(decorator, name));
  }

  private isDecorator(decorator: ts.Decorator, name: 'verify' | 'constant'): boolean {
    return this.context.builtins.isValue(tsUtils.expression.getExpression(decorator), name);
  }

  private paramToABIParameter(param: ts.Symbol): ABIParameter | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);

    return this.toABIParameter(
      tsUtils.symbol.getName(param),
      decl,
      this.context.getTypeOfSymbol(param, decl),
      tsUtils.initializer.getInitializer(decl) !== undefined,
    );
  }

  private toABIParameter(
    name: string,
    node: ts.Node,
    resolvedType: ts.Type | undefined,
    optional = false,
  ): ABIParameter | undefined {
    const type = toABIReturn(this.context, node, resolvedType, optional);
    if (type === undefined) {
      return undefined;
    }

    return { ...type, name };
  }
}
