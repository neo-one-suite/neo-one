// tslint:disable ban-types
import { ABIEvent, ABIFunction, ABIParameter, ABIReturn, ContractParameterType } from '@neo-one/client';
import { ClassInstanceMemberType, tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import { Globals, LibAliases, Libs } from '../../symbols';
import { getIdentifier, toABIReturn } from '../../utils';
import { declarations } from '../declaration';
import { NodeTranspiler } from '../NodeTranspiler';
import { Contract, TranspileResult } from '../types';
import { Transpiler } from './Transpiler';

const transpilers: ReadonlyArray<ReadonlyArray<new () => NodeTranspiler>> = [declarations];

type Transpilers = { [K in number]?: NodeTranspiler };

interface Switch {
  readonly statement: ts.IfStatement;
  readonly original: ts.Node;
}

const BYTE_ARRAY_RETURN: ABIReturn = { type: 'ByteArray' };
const BOOLEAN_RETURN: ABIReturn = { type: 'Boolean' };
const PARAMETERS: ReadonlyArray<ContractParameterType> = ['String', 'ByteArray'];
const RETURN_TYPE = 'ByteArray';
const createDefaultContract = (name: string): Contract => ({
  parameters: PARAMETERS,
  returnType: RETURN_TYPE,
  name,
  codeVersion: '1.0',
  author: 'unknown',
  email: 'unknown',
  description: '',
  properties: {
    storage: true,
    dynamicInvoke: true,
    payable: true,
  },
});

export class NEOTranspiler implements Transpiler {
  private readonly transpilers: Transpilers;
  private readonly scheduledTranspile = new Set<ts.Node>();

  public constructor(private readonly context: Context, private readonly smartContract: ts.ClassDeclaration) {
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

  public get program(): ts.Program {
    return this.context.program;
  }

  public get typeChecker(): ts.TypeChecker {
    return this.context.typeChecker;
  }

  public process(): TranspileResult {
    const events = this.processEvents();
    const contract = this.processContract();
    const { functions, statements: addedStatements } = this.processSmartContract();

    const context: ts.TransformationContext = {
      getCompilerOptions: (): ts.CompilerOptions => this.program.getCompilerOptions(),
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

    const eventStatements: ReadonlyArray<ts.Node> = events
      .map(({ call }) => {
        const parent = tsUtils.node.getParent(call);
        if (ts.isVariableDeclaration(parent)) {
          const statement = tsUtils.node.getParent(tsUtils.node.getParent(parent));
          const maybeSourceFile = tsUtils.node.getParent(statement);
          if (ts.isSourceFile(maybeSourceFile)) {
            return statement;
          }
        }

        return undefined;
      })
      .filter(utils.notNull);
    const eventReplacements = events.reduce<Map<ts.Node, string>>((acc, { replacements }) => {
      replacements.forEach((value, key) => {
        acc.set(key, value);
      });

      return acc;
    }, new Map());
    const nodesToRemove = new Set<ts.Node>(eventStatements);
    const fixedTypeNodes: Set<ts.Node> = new Set(this.getFixedTypeNodes());

    const visitOne = (node: ts.Node): ts.Node => {
      const transpiler = this.transpilers[node.kind];
      if (transpiler === undefined) {
        return node;
      }

      return transpiler.visitNode(this, node);
    };

    const replaceEventCall = (name: string, call: ts.CallExpression) => {
      const args: ReadonlyArray<ts.Expression> = [];

      return tsUtils.setOriginalRecursive(
        ts.createCall(
          ts.createIdentifier('syscall'),
          undefined,
          args
            .concat([ts.createStringLiteral('Neo.Runtime.Notify'), ts.createStringLiteral(name)])
            .concat(tsUtils.argumented.getArguments(call).map((node) => tsUtils.markOriginal(node))),
        ),
        call,
      );
    };

    const isLibDecorator = (node: ts.Decorator): boolean =>
      this.isDecorator(node, 'verify') || this.isDecorator(node, 'constant');

    const contractSourceFile = tsUtils.node.getSourceFile(this.smartContract);
    const sourceFiles = _.fromPairs(
      this.program
        .getSourceFiles()
        .map<[string, { text: string; sourceMap: RawSourceMap }] | undefined>((sourceFile) => {
          if (!tsUtils.file.isDeclarationFile(sourceFile)) {
            function visit(node: ts.Node): ts.VisitResult<ts.Node> {
              if (nodesToRemove.has(node)) {
                // tslint:disable-next-line no-null-keyword no-any
                return ts.createNotEmittedStatement(node);
              }

              if (fixedTypeNodes.has(node)) {
                return tsUtils.setOriginal(ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword), node);
              }

              if (ts.isDecorator(node) && isLibDecorator(node)) {
                return ts.createOmittedExpression();
              }

              const replacementName = eventReplacements.get(node);

              const transformedNode =
                replacementName === undefined || !ts.isCallExpression(node)
                  ? visitOne(node)
                  : replaceEventCall(replacementName, node);

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

            const result = tsUtils.print(this.program, sourceFile, transformedSourceFile);

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
        events: events
          .map(({ event }) => event)
          .filter(utils.notNull)
          .concat([
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
                  type: 'Array',
                  name: 'args',
                  value: {
                    type: 'Array',
                    value: { type: 'ByteArray' },
                  },
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

    if (this.isSmartContractType(node, this.getType(node))) {
      return true;
    }

    const baseClass = tsUtils.class_.getBaseClass(this.typeChecker, node);

    return baseClass !== undefined && this.isSmartContract(baseClass);
  }

  public isSmartContractType(node: ts.Node, type: ts.Type | undefined): boolean {
    return this.isOnlyLib(node, type, 'SmartContract');
  }

  public getType(node: ts.Node): ts.Type | undefined {
    return this.context.getType(node);
  }

  public getTypeOfSymbol(symbol: ts.Symbol | undefined, node: ts.Node): ts.Type | undefined {
    return this.context.getTypeOfSymbol(symbol, node);
  }

  public getTypeText(node: ts.Node, type: ts.Type): string {
    return tsUtils.type_.getText(this.context.typeChecker, type, node);
  }

  public getSymbol(node: ts.Node): ts.Symbol | undefined {
    return this.context.getSymbol(node);
  }

  public isOnlyGlobal(node: ts.Node, type: ts.Type | undefined, name: keyof Globals): boolean {
    return this.context.isOnlyGlobal(node, type, name);
  }

  public isLibSymbol(node: ts.Node, symbol: ts.Symbol | undefined, name: keyof Libs): boolean {
    return this.context.isLibSymbol(node, symbol, name);
  }

  public isOnlyLib(node: ts.Node, type: ts.Type | undefined, name: keyof Libs): boolean {
    return this.context.isOnlyLib(node, type, name);
  }

  public isLibAlias(identifier: ts.Identifier | undefined, name: keyof LibAliases): boolean {
    return this.context.isLibAlias(identifier, name);
  }

  public isFixedType(node: ts.Node, type: ts.Type | undefined): boolean {
    if (type === undefined) {
      return false;
    }

    const aliasSymbol = tsUtils.type_.getAliasSymbol(type);

    return this.isLibSymbol(node, aliasSymbol === undefined ? tsUtils.type_.getSymbol(type) : aliasSymbol, 'Fixed');
  }

  public reportError(node: ts.Node, message: string, code: DiagnosticCode): void {
    this.context.reportError(node, message, code);
  }

  public reportUnsupported(node: ts.Node): void {
    this.context.reportUnsupported(node);
  }

  public getFinalTypeNode(node: ts.Node, type: ts.Type | undefined, typeNode: ts.TypeNode): ts.TypeNode {
    if (type === undefined) {
      this.reportError(node, 'Unknown type', DiagnosticCode.UNKNOWN_TYPE);
    } else if (this.isFixedType(node, type)) {
      return tsUtils.setOriginal(ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword), typeNode);
    }

    return tsUtils.markOriginal(typeNode);
  }

  private processEvents(): ReadonlyArray<{
    readonly event?: ABIEvent;
    readonly call: ts.CallExpression;
    readonly replacements: Map<ts.CallExpression, string>;
  }> {
    const decl = tsUtils.symbol.getValueDeclarationOrThrow(this.context.libs.createEventHandler);
    if (decl === undefined || !ts.isFunctionDeclaration(decl)) {
      throw new Error('Something went wrong!');
    }

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

    return calls.map((call) => {
      const result = this.toABIEvent(call);

      return {
        call,
        event: result === undefined ? undefined : result.event,
        replacements: result === undefined ? new Map() : result.replacements,
      };
    });
  }

  private toABIEvent(
    call: ts.CallExpression,
  ): { readonly event: ABIEvent; readonly replacements: Map<ts.CallExpression, string> } | undefined {
    const callArguments = tsUtils.argumented.getArguments(call);
    const typeArguments = tsUtils.argumented.getTypeArguments(call);
    const nameArg = callArguments[0] as ts.Node | undefined;
    if (nameArg === undefined || !ts.isStringLiteral(nameArg)) {
      this.reportError(call, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);

      return undefined;
    }

    const name = tsUtils.literal.getLiteralValue(nameArg);
    const parameters = _.zip(callArguments.slice(1), typeArguments === undefined ? [] : typeArguments)
      .map(([paramNameArg, paramTypeNode]) => {
        if (paramNameArg === undefined || paramTypeNode === undefined) {
          this.reportError(call, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);

          return undefined;
        }

        if (!ts.isStringLiteral(paramNameArg)) {
          this.reportError(paramNameArg, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);

          return undefined;
        }

        const paramName = tsUtils.literal.getLiteralValue(paramNameArg);

        return this.toABIParameter(paramName, paramNameArg, this.getType(paramTypeNode), getIdentifier(paramTypeNode));
      })
      .filter(utils.notNull);

    const parent = tsUtils.node.getParent(call);
    const replacements = new Map<ts.CallExpression, string>();
    if (!ts.isVariableDeclaration(parent)) {
      this.reportError(nameArg, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);
    } else {
      const identifier = tsUtils.node.getNameNode(parent);
      tsUtils.reference
        .findReferencesAsNodes(this.context.program, this.context.languageService, identifier)
        .map((node) => {
          if (ts.isIdentifier(node)) {
            const nodeParent = tsUtils.node.getParent(node);
            if (ts.isCallExpression(nodeParent)) {
              return nodeParent;
            }
          }

          return undefined;
        })
        .filter(utils.notNull)
        .forEach((eventCall) => {
          replacements.set(eventCall, name);
        });
    }

    return { event: { name, parameters }, replacements };
  }

  private getFixedTypeNodes(): ReadonlyArray<ts.TypeReferenceNode> {
    const identifiers = [...this.context.libAliases.Fixed];

    return identifiers
      .map((identifier) => tsUtils.node.getParent(identifier))
      .filter(utils.notNull)
      .filter(ts.isTypeReferenceNode);
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
    const ctor = tsUtils.class_.getFirstConcreteConstructor(this.typeChecker, this.smartContract);
    if (ctor !== undefined) {
      const ctorType = this.getTypeOfSymbol(this.getSymbol(ctor.parent), ctor.parent);
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
          .map((param) => this.getFinalTypeNode(param, this.getType(param), tsUtils.type_.getTypeNode(param)));
        const argsIdentifier = ts.createIdentifier('args');
        argsStatement = ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                argsIdentifier,
                undefined,
                ts.createAsExpression(
                  ts.createCall(ts.createIdentifier('syscall'), undefined, [
                    ts.createStringLiteral('Neo.Runtime.GetArgument'),
                    ts.createNumericLiteral('1'),
                  ]),
                  ts.createTupleTypeNode(argsTypes),
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
        call = ts.createCall(ts.createIdentifier('syscall'), undefined, [
          ts.createStringLiteral('Neo.Runtime.Return'),
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
      let methodStatement: ts.Statement;

      let condition = ts.createBinary(
        ts.createIdentifier(methodIdentifier),
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.createStringLiteral(name),
      );

      if (ts.isMethodDeclaration(method)) {
        const returnType = this.getType(method);
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
          ts.createCall(ts.createIdentifier('syscall'), undefined, [
            ts.createStringLiteral('Neo.Runtime.Return'),
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
                ts.createAsExpression(
                  ts.createCall(ts.createIdentifier('syscall'), undefined, [
                    ts.createStringLiteral('Neo.Runtime.GetArgument'),
                    ts.createNumericLiteral('1'),
                  ]),
                  ts.createTupleTypeNode([
                    this.getFinalTypeNode(param, this.getType(param), tsUtils.type_.getTypeNode(param)),
                  ]),
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
          ts.createCall(ts.createIdentifier('syscall'), undefined, [
            ts.createStringLiteral('Neo.Runtime.CheckWitness'),
            ts.createPropertyAccess(ts.createIdentifier(contractIdentifier), 'owner'),
          ]),
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
                ts.createAsExpression(
                  ts.createCall(ts.createIdentifier('syscall'), undefined, [
                    ts.createStringLiteral('Neo.Runtime.GetArgument'),
                    ts.createNumericLiteral('0'),
                  ]),
                  ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
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
              ts.createCall(ts.createIdentifier('syscall'), undefined, [
                ts.createStringLiteral('Neo.Runtime.GetTrigger'),
              ]),
              ts.SyntaxKind.EqualsEqualsEqualsToken,
              ts.createNumericLiteral(`${0x10}`),
            ),
            this.smartContract,
          ),
          makeIfElse(mutableApplicationSwitches, applicationFallback),
          ts.createIf(
            ts.createBinary(
              ts.createCall(ts.createIdentifier('syscall'), undefined, [
                ts.createStringLiteral('Neo.Runtime.GetTrigger'),
              ]),
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
        'Invalid smart contract properties definition.',
        DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
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
        'Invalid smart contract properties definition.',
        DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
      );

      return defaultContract;
    }

    const decl = decls[0];
    const initializer = tsUtils.initializer.getInitializerOrThrow(decl);

    if (!ts.isObjectLiteralExpression(initializer)) {
      this.reportError(
        this.smartContract,
        'Invalid smart contract properties definition.',
        DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
      );

      return defaultContract;
    }

    const contract: { [key: string]: string } = {};
    // tslint:disable-next-line no-loop-statement
    for (const property of tsUtils.object_.getProperties(initializer)) {
      if (!ts.isPropertyAssignment(property)) {
        this.reportError(
          this.smartContract,
          'Invalid smart contract properties definition.',
          DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
        );

        return defaultContract;
      }

      const key = tsUtils.node.getName(property);
      const value = tsUtils.initializer.getInitializer(property);
      if (value === undefined || !ts.isLiteralExpression(value)) {
        this.reportError(
          this.smartContract,
          'Invalid smart contract properties definition.',
          DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
        );

        return defaultContract;
      }

      // tslint:disable-next-line no-object-mutation
      contract[key] = tsUtils.literal.getLiteralValue(value);
    }

    // tslint:disable-next-line no-object-literal-type-assertion
    return {
      ...contract,
      name,
      parameters: PARAMETERS,
      returnType: RETURN_TYPE,
      properties: this.getProperties(),
    } as Contract;
  }

  private getProperties(): Contract['properties'] {
    const decls = tsUtils.symbol.getDeclarations(this.context.globals.syscall);

    return {
      dynamicInvoke: false,
      storage: this.isSyscallUsed(decls, 'Neo.Storage.Put'),
      payable: this.isSyscallUsed(decls, 'Neo.Transaction.GetOutputs'),
    };
  }

  private isSyscallUsed(decls: ReadonlyArray<ts.Node>, name: string): boolean {
    const syscall = this.findSyscall(decls, name);

    if (!ts.isFunctionDeclaration(syscall)) {
      throw new Error('Something went wrong!');
    }

    return (
      tsUtils.reference.findReferencesAsNodes(this.context.program, this.context.languageService, syscall).length > 0
    );
  }

  private findSyscall(decls: ReadonlyArray<ts.Node>, name: string): ts.FunctionDeclaration {
    const syscallDecl = decls.filter(ts.isFunctionDeclaration).find((decl) => {
      const param = tsUtils.parametered.getParameterOrThrow(decl, 'name');
      const type = this.getType(param);

      if (type !== undefined) {
        const typeText = tsUtils.type_.getText(this.context.typeChecker, type, param).slice(1, -1);

        return typeText === name;
      }

      return false;
    });

    if (syscallDecl === undefined) {
      throw new Error(`Something went wrong. Could not find syscall ${name}`);
    }

    return syscallDecl;
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
      this.reportError(
        tsUtils.symbol.getDeclarations(symbol)[0],
        'Invalid contract function. Resolved to multiple implementation declarations.',
        DiagnosticCode.INVALID_CONTRACT_METHOD,
      );

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
    const type = this.getTypeOfSymbol(symbol, decl);
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
        const retType = toABIReturn(
          this.context,
          getDecl,
          type,
          getIdentifier(tsUtils.declaration.getReturnTypeNode(getDecl)),
        );
        mutableResult.push([
          getDecl,
          {
            name,
            constant: true,
            verify: this.hasVerify(getDecl),
            returnType:
              retType === undefined
                ? {
                    type: 'ByteArray',
                  }
                : retType,
          },
        ]);
      }

      if (setDecl !== undefined) {
        const retType = toABIReturn(
          this.context,
          setDecl,
          type,
          getIdentifier(tsUtils.type_.getTypeNode(tsUtils.parametered.getParameters(setDecl)[0])),
        );
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
                      type: 'ByteArray',
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

    const returnType = toABIReturn(this.context, decl, type, getIdentifier(tsUtils.type_.getTypeNode(decl)));
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
        'Invalid contract function. Resolved to multiple call signatures.',
        DiagnosticCode.INVALID_CONTRACT_METHOD,
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
      : toABIReturn(
          this.context,
          decl,
          callSignature.getReturnType(),
          getIdentifier(tsUtils.declaration.getReturnTypeNode(decl)),
        );
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
    return this.isOnlyLib(
      tsUtils.expression.getExpression(decorator),
      this.getType(tsUtils.expression.getExpression(decorator)),
      name,
    );
  }

  private paramToABIParameter(param: ts.Symbol): ABIParameter | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);
    const id = tsUtils.guards.isParameterDeclaration(decl) ? getIdentifier(tsUtils.type_.getTypeNode(decl)) : undefined;

    return this.toABIParameter(tsUtils.symbol.getName(param), decl, this.getTypeOfSymbol(param, decl), id);
  }

  private toABIParameter(
    name: string,
    node: ts.Node,
    resolvedType: ts.Type | undefined,
    typeIdentifier?: ts.Identifier,
  ): ABIParameter | undefined {
    const type = toABIReturn(this.context, node, resolvedType, typeIdentifier);
    if (type === undefined) {
      return undefined;
    }

    return { ...type, name };
  }
}
