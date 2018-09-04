import { ClassInstanceMemberType, tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { STRUCTURED_STORAGE_TYPES, StructuredStorageType } from '../compile/constants';
import { DEPLOY_METHOD, PROPERTIES_PROPERTY } from '../constants';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import { getSetterName } from '../utils';

export interface PropInfoBase {
  readonly classDecl: ts.ClassDeclaration;
  readonly isPublic: boolean;
}

export interface DeployPropInfo extends PropInfoBase {
  readonly type: 'deploy';
  readonly name: string;
  readonly decl?: ts.ConstructorDeclaration;
  readonly callSignature?: ts.Signature;
  readonly verify?: boolean;
}

export interface FunctionPropInfo extends PropInfoBase {
  readonly type: 'function';
  readonly name: string;
  readonly symbol: ts.Symbol;
  readonly decl: ts.MethodDeclaration;
  readonly callSignature: ts.Signature | undefined;
  readonly verify: boolean;
  readonly returnType: ts.Type | undefined;
  readonly constant: boolean;
  readonly isAbstract: boolean;
}

export interface PropertyPropInfo extends PropInfoBase {
  readonly type: 'property';
  readonly name: string;
  readonly symbol: ts.Symbol;
  readonly decl: ts.PropertyDeclaration | ts.ParameterPropertyDeclaration;
  readonly propertyType: ts.Type | undefined;
  readonly isReadonly: boolean;
  readonly isAbstract: boolean;
  readonly structuredStorageType: StructuredStorageType | undefined;
}

export interface AccessorPropInfo extends PropInfoBase {
  readonly type: 'accessor';
  readonly name: string;
  readonly symbol: ts.Symbol;
  readonly getter?: {
    readonly name: string;
    readonly decl: ts.GetAccessorDeclaration;
    readonly constant: boolean;
  };
  readonly setter?: {
    readonly name: string;
    readonly decl: ts.SetAccessorDeclaration;
  };
  readonly propertyType: ts.Type | undefined;
}

export type PropInfo = PropertyPropInfo | AccessorPropInfo | FunctionPropInfo | DeployPropInfo;

export interface ContractInfo {
  readonly smartContract: ts.ClassDeclaration;
  readonly propInfos: ReadonlyArray<PropInfo>;
  readonly superSmartContract?: ContractInfo;
}

export class ContractInfoProcessor {
  public constructor(public readonly context: Context, public readonly smartContract: ts.ClassDeclaration) {}

  public process(): ContractInfo {
    if (tsUtils.modifier.isAbstract(this.smartContract)) {
      this.context.reportUnsupported(this.smartContract);
    }
    const result = this.processClass(this.smartContract, this.context.analysis.getType(this.smartContract));

    if (this.hasDeployInfo(result)) {
      return result;
    }

    return {
      ...result,
      propInfos: result.propInfos.concat([
        {
          type: 'deploy',
          name: DEPLOY_METHOD,
          verify: false,
          classDecl: this.smartContract,
          isPublic: true,
        },
      ]),
    };
  }

  private processClass(classDecl: ts.ClassDeclaration, classType: ts.Type | undefined): ContractInfo {
    if (classType === undefined) {
      return { smartContract: classDecl, propInfos: [] };
    }

    tsUtils.class_.getStaticMembers(classDecl).forEach((member) => {
      this.context.reportUnsupported(member);
    });

    let propInfos = tsUtils.type_
      .getProperties(classType)
      .map((symbol) => this.processProperty(symbol))
      .filter(utils.notNull);

    const ctor = tsUtils.class_.getConcreteConstructor(classDecl);
    const ctorType =
      ctor === undefined
        ? undefined
        : this.context.analysis.getTypeOfSymbol(this.context.analysis.getSymbol(ctor.parent), ctor.parent);
    if (ctor !== undefined && ctorType !== undefined) {
      const callSignatures = ctorType.getConstructSignatures();
      if (callSignatures.length !== 1) {
        this.context.reportError(
          ctor,
          DiagnosticCode.InvalidContractMethod,
          DiagnosticMessage.InvalidContractMethodMultipleSignatures,
        );
      }
      const callSignature = callSignatures[0];

      propInfos = propInfos.concat([
        {
          type: 'deploy',
          name: DEPLOY_METHOD,
          classDecl,
          decl: ctor,
          verify: this.hasVerify(ctor),
          isPublic: true,
          callSignature,
        },
      ]);
    }

    const extend = tsUtils.class_.getExtends(classDecl);
    let superSmartContract: ContractInfo | undefined;
    if (extend !== undefined) {
      const expr = tsUtils.expression.getExpression(extend);
      if (ts.isIdentifier(expr)) {
        const extendSymbol = this.context.analysis.getSymbol(expr);
        const extendType = this.context.analysis.getType(extend);
        if (extendSymbol !== undefined && extendType !== undefined) {
          const decls = tsUtils.symbol.getDeclarations(extendSymbol);
          const decl = decls[0];
          if (decls.length === 1 && ts.isClassDeclaration(decl)) {
            superSmartContract = this.processClass(decl, extendType);
          } else {
            this.context.reportError(
              expr,
              DiagnosticCode.InvalidContractType,
              DiagnosticMessage.InvalidContractExtends,
            );
          }
        }
      } else {
        this.context.reportUnsupported(extend);
      }
    }

    const contractInfo = { smartContract: classDecl, propInfos, superSmartContract };
    if (
      contractInfo.propInfos.every((propInfo) => propInfo.type !== 'deploy') &&
      contractInfo.propInfos.some(
        (propInfo) => propInfo.type === 'property' && tsUtils.initializer.getInitializer(propInfo.decl) !== undefined,
      )
    ) {
      return {
        ...contractInfo,
        propInfos: contractInfo.propInfos.concat([
          {
            type: 'deploy',
            name: DEPLOY_METHOD,
            verify: false,
            classDecl: this.smartContract,
            isPublic: true,
          },
        ]),
      };
    }

    return contractInfo;
  }

  private processProperty(symbol: ts.Symbol): PropInfo | undefined {
    const decls = tsUtils.symbol.getDeclarations(symbol);
    const implDecls = decls.filter(
      (symbolDecl) =>
        (!(ts.isMethodDeclaration(symbolDecl) || ts.isConstructorDeclaration(symbolDecl)) ||
          tsUtils.overload.isImplementation(symbolDecl)) &&
        (!ts.isPropertyDeclaration(symbolDecl) || !tsUtils.modifier.isAbstract(symbolDecl)),
    );

    const decl = implDecls.length > 0 ? implDecls[0] : decls[0];
    if (
      !(
        ts.isMethodDeclaration(decl) ||
        ts.isPropertyDeclaration(decl) ||
        ts.isGetAccessorDeclaration(decl) ||
        ts.isSetAccessorDeclaration(decl) ||
        ts.isParameterPropertyDeclaration(decl)
      )
    ) {
      return undefined;
    }

    const name = tsUtils.symbol.getName(symbol);
    if (name === PROPERTIES_PROPERTY) {
      return undefined;
    }

    const type = this.context.analysis.getTypeOfSymbol(symbol, decl);
    if (type === undefined) {
      return undefined;
    }

    const classDecl = tsUtils.node.getFirstAncestorByTest(decl, ts.isClassDeclaration);
    if (classDecl === undefined) {
      this.context.reportUnsupported(decl);

      return undefined;
    }

    const isPublic = tsUtils.modifier.isPublic(decl);
    if (ts.isGetAccessorDeclaration(decl) || ts.isSetAccessorDeclaration(decl)) {
      const getDecl = ts.isGetAccessorDeclaration(decl) ? decl : tsUtils.accessor.getGetAccessor(decl);
      const setDecl = ts.isSetAccessorDeclaration(decl) ? decl : tsUtils.accessor.getSetAccessor(decl);

      return {
        type: 'accessor',
        symbol: tsUtils.symbol.getTarget(symbol),
        name: tsUtils.node.getName(decl),
        classDecl,
        getter:
          getDecl === undefined
            ? undefined
            : {
                name: tsUtils.node.getName(getDecl),
                decl: getDecl,
                constant: this.hasConstant(getDecl),
              },
        setter:
          setDecl === undefined
            ? undefined
            : {
                name: getSetterName(tsUtils.node.getName(setDecl)),
                decl: setDecl,
              },
        isPublic,
        propertyType: type,
      };
    }

    if (ts.isMethodDeclaration(decl)) {
      const callSignatures = type.getCallSignatures();
      if (callSignatures.length !== 1) {
        this.context.reportError(
          decl,
          DiagnosticCode.InvalidContractMethod,
          DiagnosticMessage.InvalidContractMethodMultipleSignatures,
        );
      }
      const callSignature = callSignatures[0];

      return {
        type: 'function',
        name: tsUtils.node.getName(decl),
        classDecl,
        symbol: tsUtils.symbol.getTarget(symbol),
        decl,
        verify: this.hasVerify(decl),
        isPublic,
        callSignature,
        returnType: callSignatures.length >= 1 ? tsUtils.signature.getReturnType(callSignature) : undefined,
        constant: this.hasConstant(decl),
        isAbstract: !tsUtils.overload.isImplementation(decl),
      };
    }

    return {
      type: 'property',
      symbol: tsUtils.symbol.getTarget(symbol),
      name: tsUtils.node.getName(decl),
      classDecl,
      decl,
      isPublic,
      propertyType: type,
      isReadonly: tsUtils.modifier.isReadonly(decl),
      isAbstract: !tsUtils.overload.isImplementation(decl),
      structuredStorageType: STRUCTURED_STORAGE_TYPES.find((structuredStorageType) =>
        this.context.builtins.isInterface(decl, type, structuredStorageType),
      ),
    };
  }

  private hasConstant(decl: ClassInstanceMemberType | ts.ConstructorDeclaration): boolean {
    return this.hasDecorator(decl, 'constant');
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

  private hasDeployInfo(contractInfo: ContractInfo): boolean {
    if (contractInfo.propInfos.some((propInfo) => propInfo.type === 'deploy')) {
      return true;
    }

    const superSmartContract = contractInfo.superSmartContract;
    if (superSmartContract === undefined) {
      return false;
    }

    return this.hasDeployInfo(superSmartContract);
  }
}
