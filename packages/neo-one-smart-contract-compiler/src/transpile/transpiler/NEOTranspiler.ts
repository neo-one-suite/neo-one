// tslint:disable ban-types
import {
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
} from '@neo-one/client';
import Ast, {
  CallExpression,
  ClassDeclaration,
  ClassInstanceMemberTypes,
  Identifier,
  Node,
  SourceFile,
  Symbol,
  SyntaxKind,
  Type,
  TypeGuards,
  TypeNode,
} from 'ts-simple-ast';

import _ from 'lodash';

import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import * as nodeUtils from '../../nodeUtils';
import { Globals, LibAliases, Libs } from '../../symbols';
import * as typeUtils from '../../typeUtils';
import declarations from '../declaration';
import { NodeTranspiler } from '../NodeTranspiler';
import { TranspileResult, VisitOptions } from '../types';
import { Transpiler } from './Transpiler';

const transpilers = [declarations];

interface Transpilers {
  [kind: number]: NodeTranspiler<any>;
}

export class NEOTranspiler implements Transpiler {
  private readonly transpilers: Transpilers;

  constructor(
    private readonly context: Context,
    private readonly ast: Ast,
    private readonly smartContract: ClassDeclaration,
  ) {
    this.transpilers = (transpilers as Array<
      Array<new () => NodeTranspiler<any>>
    >)
      .reduce((acc, kindCompilers) => acc.concat(kindCompilers), [])
      .reduce(
        (acc, KindCompiler) => {
          const kindCompiler = new KindCompiler();
          if (acc[kindCompiler.kind] != null) {
            throw new Error(
              `Found duplicate compiler for kind ${kindCompiler.kind}`,
            );
          }

          acc[kindCompiler.kind] = kindCompiler;
          return acc;
        },
        {} as Transpilers,
      );
  }

  public process(): TranspileResult {
    const file = this.smartContract.getSourceFile();
    const events = this.processEvents(file);
    this.visit(this.smartContract, { isSmartContract: true });
    this.context.libAliases.reset();
    const functions = this.processSmartContract(file);
    this.strip();

    return {
      ast: this.ast,
      sourceFile: file,
      abi: { functions, events },
      context: this.context,
    };
  }

  public visit(node: Node, options: VisitOptions): void {
    const transpiler = this.transpilers[node.compilerNode.kind];
    if (transpiler != null) {
      transpiler.visitNode(this, node, options);
    }
  }

  public isSmartContract(node: ClassDeclaration): boolean {
    return (
      node === this.smartContract ||
      node.getDerivedClasses().some((derived) => this.isSmartContract(derived))
    );
  }

  public getType(node: Node): Type | undefined {
    return this.context.getType(node);
  }

  public getTypeOfSymbol(
    symbol: Symbol | undefined,
    node: Node,
  ): Type | undefined {
    return this.context.getTypeOfSymbol(symbol, node);
  }

  public getSymbol(node: Node): Symbol | undefined {
    return this.context.getSymbol(node);
  }

  public isOnlyGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean {
    return this.context.isOnlyGlobal(node, type, name);
  }

  public isLibSymbol(
    node: Node,
    symbol: Symbol | undefined,
    name: keyof Libs,
  ): boolean {
    return this.context.isLibSymbol(node, symbol, name);
  }

  public isOnlyLib(
    node: Node,
    type: Type | undefined,
    name: keyof Libs,
  ): boolean {
    return this.context.isOnlyLib(node, type, name);
  }

  public isLibAlias(
    identifier: Identifier | undefined,
    name: keyof LibAliases,
  ): boolean {
    return this.context.isLibAlias(identifier, name);
  }

  public isFixedType(node: Node, type: Type | undefined): boolean {
    if (type == null) {
      return false;
    }

    return this.isLibSymbol(
      node,
      type.getAliasSymbol() || type.getSymbol(),
      'Fixed',
    );
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

  public assertNotNull<T>(value: T | undefined | null): T {
    return this.context.assertNotNull(value);
  }

  public filterNotNull<T>(value: T | undefined | null): value is T {
    return value != null;
  }

  private processEvents(file: SourceFile): ABIEvent[] {
    const decl = this.context.libs.createEventHandler.getValueDeclarationOrThrow();
    if (decl == null || !TypeGuards.isReferenceFindableNode(decl)) {
      throw new Error('Something went wrong!');
    }

    const calls = decl
      .findReferencesAsNodes()
      .map((node) => {
        if (TypeGuards.isIdentifier(node)) {
          const parent = node.getParent();
          if (parent != null && TypeGuards.isCallExpression(parent)) {
            return parent;
          }
        }
        return null;
      })
      .filter(this.filterNotNull);
    const events = calls
      .map((call) => this.toABIEvent(call))
      .filter(this.filterNotNull);

    return events;
  }

  private toABIEvent(call: CallExpression): ABIEvent | null {
    const nameArg = call.getArguments()[0];
    if (nameArg == null || !TypeGuards.isStringLiteral(nameArg)) {
      this.reportError(
        nameArg,
        'Invalid event specification.',
        DiagnosticCode.INVALID_CONTRACT_EVENT,
      );
      return null;
    }

    const name = nameArg.getLiteralValue();
    const parameters = _.zip(
      call.getArguments().slice(1),
      call.getTypeArguments(),
    )
      .map(([paramNameArg, paramTypeNode]) => {
        if (paramNameArg == null || paramTypeNode == null) {
          this.reportError(
            call,
            'Invalid event specification.',
            DiagnosticCode.INVALID_CONTRACT_EVENT,
          );
          return null;
        }

        if (!TypeGuards.isStringLiteral(paramNameArg)) {
          this.reportError(
            paramNameArg,
            'Invalid event specification.',
            DiagnosticCode.INVALID_CONTRACT_EVENT,
          );
          return null;
        }

        const paramName = paramNameArg.getLiteralValue();
        return this.toABIParameter(
          paramName,
          paramNameArg,
          this.getType(paramTypeNode),
          this.getIdentifier(paramTypeNode),
        );
      })
      .filter(this.filterNotNull);

    const parent = call.getParent();
    if (parent == null || !TypeGuards.isVariableDeclaration(parent)) {
      this.reportError(
        nameArg,
        'Invalid event specification.',
        DiagnosticCode.INVALID_CONTRACT_EVENT,
      );
    } else {
      const identifier = parent.getNameNode();
      identifier
        .findReferencesAsNodes()
        .map((node) => {
          if (TypeGuards.isIdentifier(node)) {
            const nodeParent = node.getParent();
            if (nodeParent != null && TypeGuards.isCallExpression(nodeParent)) {
              return nodeParent;
            }
          }

          return null;
        })
        .filter(this.filterNotNull)
        .forEach((eventCall) => this.replaceEventCall(name, eventCall));

      parent.remove();
    }

    return { name, parameters };
  }

  private replaceEventCall(name: string, call: CallExpression): void {
    const args = [`'${name}'`]
      .concat(call.getArguments().map((arg) => arg.getText()))
      .join(', ');
    call.replaceWithText(`syscall('Neo.Runtime.Notify', ${args})`);
  }

  private strip(): void {
    this.context.libAliases.reset();
    const identifiers = [...this.context.libAliases.Fixed];
    identifiers.forEach((identifier) => {
      const parent = identifier.getParent();
      if (parent != null && TypeGuards.isTypeReferenceNode(parent)) {
        parent.replaceWithText('number');
      }
    });
  }

  private processSmartContract(file: SourceFile): ABIFunction[] {
    const smartContract = file.getClassOrThrow(
      this.smartContract.getNameOrThrow(),
    );
    const methods = smartContract
      .getType()
      .getProperties()
      .map((symbol) => this.processProperty(symbol))
      .reduce((acc, values) => acc.concat(values), []);

    const verifySwitches: string[] = [];
    const applicationSwitches: string[] = [];
    const functions: ABIFunction[] = [];
    for (const [method, func] of methods) {
      const name = TypeGuards.isParameterDeclaration(method)
        ? method.getNameOrThrow()
        : method.getName();
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
            .map((param, idx) => `args[${idx}]`)
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

      applicationSwitches.push(methodSwitch);
      if (func.verify) {
        verifySwitches.push(methodSwitch);
      }

      functions.push(func);
    }

    const applicationFallback =
      applicationSwitches.length === 0
        ? 'throw new Error('
        : ` else {
        throw new Error('Unknown method');
      }`;
    let verifyFallback = `
      if (!syscall('Neo.Runtime.CheckWitness', contract.owner)) {
        throw new Error('Invalid witness');
      }
    `;
    if (verifySwitches.length > 0) {
      verifyFallback = `else {
        ${verifyFallback}
      }`;
    }

    const statements = `
      const contract = new ${this.smartContract.getName()}();
      const method = syscall('Neo.Runtime.GetArgument', 0) as string;
      if (syscall('Neo.Runtime.GetTrigger') === 0x10) {
        ${applicationSwitches.join(' else ')}
        ${applicationFallback}
      } else if (syscall('Neo.Runtime.GetTrigger') === 0x00) {
        ${verifySwitches.join(' else ')}
        ${verifyFallback}
      } else {
        throw new Error('Unsupported trigger');
      }
    `;

    file.addStatements(statements);

    return functions;
  }

  private processProperty(
    symbol: Symbol,
  ): Array<[ClassInstanceMemberTypes, ABIFunction]> {
    const decls = symbol
      .getDeclarations()
      .filter(
        (symbolDecl) =>
          !TypeGuards.isMethodDeclaration(symbolDecl) ||
          symbolDecl.isImplementation(),
      );
    if (
      !(
        decls.length === 1 ||
        (decls.length === 2 &&
          decls.some((accessor) =>
            TypeGuards.isGetAccessorDeclaration(accessor),
          ) &&
          decls.some((accessor) =>
            TypeGuards.isSetAccessorDeclaration(accessor),
          ))
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
    if (type == null) {
      return [];
    }

    if (
      TypeGuards.isGetAccessorDeclaration(decl) ||
      TypeGuards.isSetAccessorDeclaration(decl)
    ) {
      const getDecl = TypeGuards.isGetAccessorDeclaration(decl)
        ? decl
        : decl.getGetAccessor();
      const setDecl = TypeGuards.isSetAccessorDeclaration(decl)
        ? decl
        : decl.getSetAccessor();
      const result: Array<[ClassInstanceMemberTypes, ABIFunction]> = [];
      if (getDecl != null && nodeUtils.isPublic(getDecl)) {
        result.push([
          getDecl,
          {
            name,
            constant: true,
            verify: this.hasVerify(getDecl),
            returnType: this.toABIReturn(
              getDecl,
              type,
              this.getIdentifier(getDecl.getReturnTypeNode()),
            ) || { type: 'ByteArray' },
          },
        ]);
      }

      if (setDecl != null && nodeUtils.isPublic(setDecl)) {
        result.push([
          setDecl,
          {
            name,
            constant: false,
            verify: this.hasVerify(setDecl),
            parameters: [
              {
                name: setDecl.getParameters()[0].getNameOrThrow(),
                ...(this.toABIReturn(
                  setDecl,
                  type,
                  this.getIdentifier(setDecl.getParameters()[0].getTypeNode()),
                ) || { type: 'ByteArray' }),
              },
            ],
            returnType: { type: 'Void' },
          },
        ]);
      }

      return result;
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
        .filter(this.filterNotNull);
      const returnType = this.toABIReturn(
        decl,
        callSignature.getReturnType(),
        this.getIdentifier(decl.getReturnTypeNode()),
      );
      const constant = this.hasDecorator(decl, 'constant');
      const func = {
        name,
        constant,
        verify,
        parameters,
        returnType: returnType || { type: 'ByteArray' },
      };
      return [[decl, func]];
    } else {
      const returnType = this.toABIReturn(
        decl,
        type,
        this.getIdentifier(decl.getTypeNode()),
      );
      const func = {
        name,
        constant: true,
        verify,
        returnType: returnType || { type: 'ByteArray' },
      };

      return [[decl, func]];
    }
  }

  private hasVerify(decl: ClassInstanceMemberTypes): boolean {
    return this.hasDecorator(decl, 'verify');
  }

  private hasDecorator(
    decl: ClassInstanceMemberTypes,
    name: 'verify' | 'constant',
  ): boolean {
    return decl
      .getDecorators()
      .some((decorator) =>
        this.isOnlyLib(
          decorator.getExpression(),
          this.getType(decorator.getExpression()),
          name,
        ),
      );
  }

  private paramToABIParameter(param: Symbol): ABIParameter | undefined {
    const decl = this.assertNotNull(param.getDeclarations()[0]);
    const id = TypeGuards.isParameterDeclaration(decl)
      ? this.getIdentifier(decl.getTypeNode())
      : undefined;

    return this.toABIParameter(
      param.getName(),
      decl,
      this.getTypeOfSymbol(param, decl),
      id,
    );
  }

  private toABIParameter(
    name: string,
    node: Node,
    resolvedType: Type | undefined,
    typeIdentifier?: Identifier,
  ): ABIParameter | undefined {
    const type = this.toABIReturn(node, resolvedType, typeIdentifier);
    if (type == null) {
      return undefined;
    }

    return { ...type, name };
  }

  private toABIReturn(
    node: Node,
    resolvedType: Type | undefined,
    typeIdentifier?: Identifier,
  ): ABIReturn | undefined {
    if (resolvedType == null && typeIdentifier == null) {
      this.reportError(
        node,
        'Could not detect ABI, unknown type.',
        DiagnosticCode.UNKNOWN_TYPE,
      );
      return undefined;
    }

    if (typeUtils.isOnlyBoolean(resolvedType)) {
      return { type: 'Boolean' };
    } else if (this.isLibAlias(typeIdentifier, 'Address')) {
      return { type: 'Hash160' };
    } else if (this.isLibAlias(typeIdentifier, 'Hash256')) {
      return { type: 'Hash256' };
    } else if (this.isLibAlias(typeIdentifier, 'Signature')) {
      return { type: 'Signature' };
    } else if (this.isLibAlias(typeIdentifier, 'PublicKey')) {
      return { type: 'PublicKey' };
    } else if (typeUtils.isVoid(resolvedType)) {
      return { type: 'Void' };
    } else if (typeUtils.isOnlyString(resolvedType)) {
      return { type: 'String' };
    } else if (typeUtils.isOnlyNumberLiteral(resolvedType)) {
      return { type: 'Integer', decimals: 0 };
    } else if (this.isFixedType(node, resolvedType) && resolvedType != null) {
      const decimals = this.getFixedDecimals(resolvedType);
      return { type: 'Integer', decimals };
    } else if (typeUtils.isOnlyNumber(resolvedType)) {
      return { type: 'Integer', decimals: 0 };
    } else if (typeUtils.isOnlyArray(resolvedType) && resolvedType != null) {
      const value = this.toABIReturn(node, resolvedType.getTypeArguments()[0]);
      if (value != null) {
        return { type: 'Array', value };
      }
    } else if (this.isOnlyGlobal(node, resolvedType, 'Buffer')) {
      return { type: 'ByteArray' };
    } else {
      this.reportError(
        node,
        'Invalid contract type.',
        DiagnosticCode.INVALID_CONTRACT_TYPE,
      );
    }

    return undefined;
  }

  private getFixedDecimals(type: Type): number {
    return (type.getUnionTypes()[1].getIntersectionTypes()[1]
      .compilerType as any).typeArguments[0].value;
  }

  private getIdentifier(node: TypeNode | undefined): Identifier | undefined {
    return node == null
      ? node
      : node.getFirstChildByKind(SyntaxKind.Identifier);
  }

  private getTypeText(node: Node, type: Type | undefined): string {
    let typeText = 'any';
    if (type == null) {
      this.reportError(node, 'Unknown type', DiagnosticCode.UNKNOWN_TYPE);
    } else if (this.isFixedType(node, type)) {
      typeText = 'number';
    } else {
      typeText = type.getText();
    }

    return typeText;
  }
}
