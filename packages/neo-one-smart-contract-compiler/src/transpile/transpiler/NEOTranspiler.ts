// tslint:disable ban-types
import { ABIEvent, ABIFunction, ABIParameter, ABIReturn, ContractParameterType } from '@neo-one/client';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import Project, {
  CallExpression,
  ClassDeclaration,
  ClassInstanceMemberTypes,
  FunctionDeclaration,
  Identifier,
  Node,
  SourceFile,
  Symbol,
  SyntaxKind,
  Type,
  TypeGuards,
  TypeNode,
} from 'ts-simple-ast';
import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import * as nodeUtils from '../../nodeUtils';
import { Globals, LibAliases, Libs } from '../../symbols';
import * as typeUtils from '../../typeUtils';
import { declarations } from '../declaration';
import { NodeTranspiler } from '../NodeTranspiler';
import { Contract, TranspileResult, VisitOptions } from '../types';
import { Transpiler } from './Transpiler';

const transpilers: ReadonlyArray<ReadonlyArray<new () => NodeTranspiler>> = [declarations];

type Transpilers = { [K in number]?: NodeTranspiler };

const BYTE_ARRAY_RETURN: ABIReturn = { type: 'ByteArray' };
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

  public constructor(
    private readonly context: Context,
    private readonly ast: Project,
    private readonly smartContract: ClassDeclaration,
  ) {
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
    const file = this.smartContract.getSourceFile();
    const events = this.processEvents();
    this.visit(this.smartContract, { isSmartContract: true });
    this.context.libAliases.reset();
    const functions = this.processSmartContract(file);
    const contract = this.processContract(file);
    this.strip();

    return {
      ast: this.ast,
      sourceFile: file,
      abi: { functions, events },
      context: this.context,
      contract,
    };
  }

  public visit(node: Node, options: VisitOptions): void {
    const transpiler = this.transpilers[node.compilerNode.kind];
    if (transpiler !== undefined) {
      transpiler.visitNode(this, node, options);
    }
  }

  public isSmartContract(node: ClassDeclaration): boolean {
    return node === this.smartContract || node.getDerivedClasses().some((derived) => this.isSmartContract(derived));
  }

  public getType(node: Node): Type | undefined {
    return this.context.getType(node);
  }

  public getTypeOfSymbol(symbol: Symbol | undefined, node: Node): Type | undefined {
    return this.context.getTypeOfSymbol(symbol, node);
  }

  public getSymbol(node: Node): Symbol | undefined {
    return this.context.getSymbol(node);
  }

  public isOnlyGlobal(node: Node, type: Type | undefined, name: keyof Globals): boolean {
    return this.context.isOnlyGlobal(node, type, name);
  }

  public isLibSymbol(node: Node, symbol: Symbol | undefined, name: keyof Libs): boolean {
    return this.context.isLibSymbol(node, symbol, name);
  }

  public isOnlyLib(node: Node, type: Type | undefined, name: keyof Libs): boolean {
    return this.context.isOnlyLib(node, type, name);
  }

  public isLibAlias(identifier: Identifier | undefined, name: keyof LibAliases): boolean {
    return this.context.isLibAlias(identifier, name);
  }

  public isFixedType(node: Node, type: Type | undefined): boolean {
    if (type === undefined) {
      return false;
    }

    return this.isLibSymbol(node, type.getAliasSymbol() || type.getSymbol(), 'Fixed');
  }

  public isSmartContractOptions(options: VisitOptions): VisitOptions {
    return { ...options, isSmartContract: true };
  }

  public reportError(node: Node, message: string, code: DiagnosticCode): void {
    this.context.reportError(node, message, code);
  }

  public reportUnsupported(node: Node): void {
    this.context.reportUnsupported(node);
  }

  private processEvents(): ReadonlyArray<ABIEvent> {
    const decl = this.context.libs.createEventHandler.getValueDeclarationOrThrow();
    if (!TypeGuards.isReferenceFindableNode(decl)) {
      throw new Error('Something went wrong!');
    }

    const calls = decl
      .findReferencesAsNodes()
      .map((node) => {
        if (TypeGuards.isIdentifier(node)) {
          const parent = node.getParent();
          if (parent !== undefined && TypeGuards.isCallExpression(parent)) {
            return parent;
          }
        }

        return undefined;
      })
      .filter(utils.notNull);

    return calls.map((call) => this.toABIEvent(call)).filter(utils.notNull);
  }

  private toABIEvent(call: CallExpression): ABIEvent | undefined {
    const nameArg = call.getArguments()[0] as Node | undefined;
    if (nameArg === undefined || !TypeGuards.isStringLiteral(nameArg)) {
      this.reportError(call, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);

      return undefined;
    }

    const name = nameArg.getLiteralValue();
    const parameters = _.zip(call.getArguments().slice(1), call.getTypeArguments())
      .map(([paramNameArg, paramTypeNode]) => {
        if (paramNameArg === undefined || paramTypeNode === undefined) {
          this.reportError(call, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);

          return undefined;
        }

        if (!TypeGuards.isStringLiteral(paramNameArg)) {
          this.reportError(paramNameArg, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);

          return undefined;
        }

        const paramName = paramNameArg.getLiteralValue();

        return this.toABIParameter(
          paramName,
          paramNameArg,
          this.getType(paramTypeNode),
          this.getIdentifier(paramTypeNode),
        );
      })
      .filter(utils.notNull);

    const parent = call.getParent();
    if (parent === undefined || !TypeGuards.isVariableDeclaration(parent)) {
      this.reportError(nameArg, 'Invalid event specification.', DiagnosticCode.INVALID_CONTRACT_EVENT);
    } else {
      const identifier = parent.getNameNode();
      identifier
        .findReferencesAsNodes()
        .map((node) => {
          if (TypeGuards.isIdentifier(node)) {
            const nodeParent = node.getParent();
            if (nodeParent !== undefined && TypeGuards.isCallExpression(nodeParent)) {
              return nodeParent;
            }
          }

          return undefined;
        })
        .filter(utils.notNull)
        .forEach((eventCall) => this.replaceEventCall(name, eventCall));

      parent.remove();
    }

    return { name, parameters };
  }

  private replaceEventCall(name: string, call: CallExpression): void {
    const args = [`'${name}'`].concat(call.getArguments().map((arg) => arg.getText())).join(', ');
    call.replaceWithText(`syscall('Neo.Runtime.Notify', ${args})`);
  }

  private strip(): void {
    this.context.libAliases.reset();
    const identifiers = [...this.context.libAliases.Fixed];
    identifiers.forEach((identifier) => {
      const parent = identifier.getParent();
      if (parent !== undefined && TypeGuards.isTypeReferenceNode(parent)) {
        parent.replaceWithText('number');
      }
    });
  }

  private processSmartContract(file: SourceFile): ReadonlyArray<ABIFunction> {
    const smartContract = file.getClassOrThrow(this.smartContract.getNameOrThrow());
    const methods = smartContract
      .getType()
      .getProperties()
      .map((symbol) => this.processProperty(symbol))
      .reduce((acc, values) => acc.concat(values), []);

    const mutableVerifySwitches: string[] = [];
    const mutableApplicationSwitches: string[] = [];
    const mutableFunctions: ABIFunction[] = [];
    methods.forEach(([method, func]) => {
      const name = TypeGuards.isParameterDeclaration(method) ? method.getNameOrThrow() : method.getName();
      let methodSwitch;
      if (TypeGuards.isMethodDeclaration(method)) {
        let argsStatement = '';
        let args = '';
        if (method.getParameters().length > 0) {
          const argsTypes = method
            .getParameters()
            .map((param) => this.getTypeText(param, this.getType(param)))
            .join(',');
          argsStatement = `const args = syscall('Neo.Runtime.GetArgument', 1) as [${argsTypes}];\n`;
          args = method
            .getParameters()
            .map((_param, idx) => `args[${idx}]`)
            .join(', ');
        }
        let call = `contract.${name}(${args})`;
        if (!typeUtils.isVoid(method.getReturnType())) {
          call = `syscall('Neo.Runtime.Return', ${call})`;
        }
        methodSwitch = `
          if (method === '${name}') {
            ${argsStatement}${call};
          }
        `;
      } else if (
        TypeGuards.isGetAccessorDeclaration(method) ||
        TypeGuards.isPropertyDeclaration(method) ||
        TypeGuards.isParameterDeclaration(method)
      ) {
        methodSwitch = `
          if (method === '${name}') {
            syscall('Neo.Runtime.Return', contract.${name});
          }
        `;
      } else {
        const param = method.getParameters()[0];
        const typeText = this.getTypeText(param, this.getType(param));
        methodSwitch = `
          if (method === 'set${name[0].toUpperCase()}${name.slice(1)}') {
            contract.${name} = (syscall('Neo.Runtime.GetArgument', 1) as [${typeText}])[0];
          }
        `;
      }

      mutableApplicationSwitches.push(methodSwitch);
      if (func.verify) {
        mutableVerifySwitches.push(methodSwitch);
      }

      mutableFunctions.push(func);
    });

    const applicationFallback =
      mutableApplicationSwitches.length === 0
        ? 'throw new Error('
        : ` else {
        throw new Error('Unknown method');
      }`;
    let verifyFallback = `
      if (!syscall('Neo.Runtime.CheckWitness', contract.owner)) {
        throw new Error('Invalid witness');
      }
    `;
    if (mutableVerifySwitches.length > 0) {
      verifyFallback = `else {
        ${verifyFallback}
      }`;
    }

    const statements = `
      const contract = new ${this.smartContract.getName()}();
      const method = syscall('Neo.Runtime.GetArgument', 0) as string;
      if (syscall('Neo.Runtime.GetTrigger') === 0x10) {
        ${mutableApplicationSwitches.join(' else ')}
        ${applicationFallback}
      } else if (syscall('Neo.Runtime.GetTrigger') === 0x00) {
        ${mutableVerifySwitches.join(' else ')}
        ${verifyFallback}
      } else {
        throw new Error('Unsupported trigger');
      }
    `;

    file.addStatements(statements);

    return mutableFunctions;
  }

  private processContract(file: SourceFile): Contract {
    const name = this.smartContract.getNameOrThrow();
    const defaultContract = createDefaultContract(name);
    const smartContract = file.getClassOrThrow(name);

    const properties = smartContract.getType().getProperty('properties');

    if (properties === undefined) {
      this.reportError(
        smartContract,
        'Invalid smart contract properties definition.',
        DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
      );

      return defaultContract;
    }

    const decls = properties
      .getDeclarations()
      .filter(TypeGuards.isPropertyDeclaration)
      .filter((prop) => prop.getInitializer() !== undefined);
    if (decls.length !== 1) {
      this.reportError(
        smartContract,
        'Invalid smart contract properties definition.',
        DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
      );

      return defaultContract;
    }

    const decl = decls[0];
    const initializer = decl.getInitializerOrThrow();

    if (!TypeGuards.isObjectLiteralExpression(initializer)) {
      this.reportError(
        smartContract,
        'Invalid smart contract properties definition.',
        DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
      );

      return defaultContract;
    }

    const contract: { [key: string]: string } = {};
    // tslint:disable-next-line no-loop-statement
    for (const property of initializer.getProperties()) {
      if (!TypeGuards.isPropertyAssignment(property)) {
        this.reportError(
          smartContract,
          'Invalid smart contract properties definition.',
          DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
        );

        return defaultContract;
      }

      const key = property.getName();
      const value = property.getInitializer();
      if (value === undefined || !TypeGuards.isLiteralExpression(value)) {
        this.reportError(
          smartContract,
          'Invalid smart contract properties definition.',
          DiagnosticCode.INVALID_CONTRACT_PROPERTIES,
        );

        return defaultContract;
      }

      // tslint:disable-next-line no-object-mutation
      contract[key] = value.getLiteralText();
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
    const decls = this.context.globals.syscall.getDeclarations();

    return {
      dynamicInvoke: false,
      storage: this.isSyscallUsed(decls, 'Neo.Storage.Put'),
      payable: this.isSyscallUsed(decls, 'Neo.Transaction.GetOutputs'),
    };
  }

  private isSyscallUsed(decls: ReadonlyArray<Node>, name: string): boolean {
    const syscall = this.findSyscall(decls, name);

    if (!TypeGuards.isReferenceFindableNode(syscall)) {
      throw new Error('Something went wrong!');
    }

    return syscall.findReferencesAsNodes().length > 0;
  }

  private findSyscall(decls: ReadonlyArray<Node>, name: string): FunctionDeclaration {
    const syscallDecl = decls.filter(TypeGuards.isFunctionDeclaration).find(
      (decl) =>
        decl
          .getParameterOrThrow('name')
          .getTypeNodeOrThrow()
          .getText() === `'${name}'`,
    );

    if (syscallDecl === undefined) {
      throw new Error('Something went wrong.');
    }

    return syscallDecl;
  }

  private processProperty(symbol: Symbol): ReadonlyArray<[ClassInstanceMemberTypes, ABIFunction]> {
    const decls = symbol
      .getDeclarations()
      .filter((symbolDecl) => !TypeGuards.isMethodDeclaration(symbolDecl) || symbolDecl.isImplementation());
    if (
      !(
        decls.length === 1 ||
        (decls.length === 2 &&
          decls.some((accessor) => TypeGuards.isGetAccessorDeclaration(accessor)) &&
          decls.some((accessor) => TypeGuards.isSetAccessorDeclaration(accessor)))
      )
    ) {
      this.reportError(
        symbol.getDeclarations()[0],
        'Invalid contract function. Resolved to multiple implementation declarations.',
        DiagnosticCode.INVALID_CONTRACT_METHOD,
      );

      return [];
    }
    const decl = decls[0];
    if (
      !(
        TypeGuards.isMethodDeclaration(decl) ||
        TypeGuards.isPropertyDeclaration(decl) ||
        TypeGuards.isGetAccessorDeclaration(decl) ||
        TypeGuards.isSetAccessorDeclaration(decl) ||
        TypeGuards.isParameterDeclaration(decl)
      )
    ) {
      return [];
    }

    const name = symbol.getName();
    const type = this.getTypeOfSymbol(symbol, decl);
    if (type === undefined) {
      return [];
    }

    if (TypeGuards.isGetAccessorDeclaration(decl) || TypeGuards.isSetAccessorDeclaration(decl)) {
      const getDecl = TypeGuards.isGetAccessorDeclaration(decl) ? decl : decl.getGetAccessor();
      const setDecl = TypeGuards.isSetAccessorDeclaration(decl) ? decl : decl.getSetAccessor();
      const mutableResult: Array<[ClassInstanceMemberTypes, ABIFunction]> = [];
      if (getDecl !== undefined && nodeUtils.isPublic(getDecl)) {
        const retType = this.toABIReturn(getDecl, type, this.getIdentifier(getDecl.getReturnTypeNode()));
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

      if (setDecl !== undefined && nodeUtils.isPublic(setDecl)) {
        const retType = this.toABIReturn(setDecl, type, this.getIdentifier(setDecl.getParameters()[0].getTypeNode()));
        mutableResult.push([
          setDecl,
          {
            name,
            constant: false,
            verify: this.hasVerify(setDecl),
            parameters: [
              {
                name: setDecl.getParameters()[0].getNameOrThrow(),
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

    if (!nodeUtils.isPublic(decl)) {
      return [];
    }

    const verify = this.hasVerify(decl);
    if (TypeGuards.isMethodDeclaration(decl)) {
      const callSignatures = type.getCallSignatures();
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
      const currentReturnType = this.toABIReturn(
        decl,
        callSignature.getReturnType(),
        this.getIdentifier(decl.getReturnTypeNode()),
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

    const returnType = this.toABIReturn(decl, type, this.getIdentifier(decl.getTypeNode()));
    const func = {
      name,
      constant: true,
      verify,
      returnType: returnType === undefined ? BYTE_ARRAY_RETURN : returnType,
    };

    return [[decl, func]];
  }

  private hasVerify(decl: ClassInstanceMemberTypes): boolean {
    return this.hasDecorator(decl, 'verify');
  }

  private hasDecorator(decl: ClassInstanceMemberTypes, name: 'verify' | 'constant'): boolean {
    return decl
      .getDecorators()
      .some((decorator) => this.isOnlyLib(decorator.getExpression(), this.getType(decorator.getExpression()), name));
  }

  private paramToABIParameter(param: Symbol): ABIParameter | undefined {
    const decl = utils.nullthrows(param.getDeclarations()[0]);
    const id = TypeGuards.isParameterDeclaration(decl) ? this.getIdentifier(decl.getTypeNode()) : undefined;

    return this.toABIParameter(param.getName(), decl, this.getTypeOfSymbol(param, decl), id);
  }

  private toABIParameter(
    name: string,
    node: Node,
    resolvedType: Type | undefined,
    typeIdentifier?: Identifier,
  ): ABIParameter | undefined {
    const type = this.toABIReturn(node, resolvedType, typeIdentifier);
    if (type === undefined) {
      return undefined;
    }

    return { ...type, name };
  }

  private toABIReturn(node: Node, resolvedType: Type | undefined, typeIdentifier?: Identifier): ABIReturn | undefined {
    if (resolvedType === undefined && typeIdentifier === undefined) {
      this.reportError(node, 'Could not detect ABI, unknown type.', DiagnosticCode.UNKNOWN_TYPE);

      return undefined;
    }

    if (typeUtils.isOnlyBoolean(resolvedType)) {
      return { type: 'Boolean' };
    }

    if (this.isLibAlias(typeIdentifier, 'Address')) {
      return { type: 'Hash160' };
    }

    if (this.isLibAlias(typeIdentifier, 'Hash256')) {
      return { type: 'Hash256' };
    }

    if (this.isLibAlias(typeIdentifier, 'Signature')) {
      return { type: 'Signature' };
    }

    if (this.isLibAlias(typeIdentifier, 'PublicKey')) {
      return { type: 'PublicKey' };
    }

    if (typeUtils.isVoid(resolvedType)) {
      return { type: 'Void' };
    }

    if (typeUtils.isOnlyString(resolvedType)) {
      return { type: 'String' };
    }

    if (typeUtils.isOnlyNumberLiteral(resolvedType)) {
      return { type: 'Integer', decimals: 0 };
    }

    if (this.isFixedType(node, resolvedType) && resolvedType !== undefined) {
      const decimals = this.getFixedDecimals(resolvedType);

      return { type: 'Integer', decimals };
    }

    if (typeUtils.isOnlyNumber(resolvedType)) {
      return { type: 'Integer', decimals: 0 };
    }

    if (typeUtils.isOnlyArray(resolvedType) && resolvedType !== undefined) {
      const value = this.toABIReturn(node, resolvedType.getTypeArguments()[0]);
      if (value !== undefined) {
        return { type: 'Array', value };
      }
    }

    if (this.isOnlyGlobal(node, resolvedType, 'Buffer')) {
      return BYTE_ARRAY_RETURN;
    }

    this.reportError(node, 'Invalid contract type.', DiagnosticCode.INVALID_CONTRACT_TYPE);

    return undefined;
  }

  private getFixedDecimals(type: Type): number {
    // tslint:disable-next-line no-any
    return (type.getUnionTypes()[1].getIntersectionTypes()[1].compilerType as any).typeArguments[0].value;
  }

  private getIdentifier(node: TypeNode | undefined): Identifier | undefined {
    return node === undefined ? node : node.getFirstChildByKind(SyntaxKind.Identifier);
  }

  private getTypeText(node: Node, type: Type | undefined): string {
    let typeText = 'any';
    if (type === undefined) {
      this.reportError(node, 'Unknown type', DiagnosticCode.UNKNOWN_TYPE);
    } else if (this.isFixedType(node, type)) {
      typeText = 'number';
    } else {
      typeText = type.getText();
    }

    return typeText;
  }
}
