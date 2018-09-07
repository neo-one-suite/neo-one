import { ClassInstanceMemberType, tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { STRUCTURED_STORAGE_TYPES, StructuredStorageType } from '../compile/constants';
import { isOnlyBoolean } from '../compile/helper/types';
import {
  BUILTIN_PROPERTIES,
  ContractPropertyName,
  Decorator,
  DECORATORS_ARRAY,
  IGNORED_PROPERTIES,
  RESERVED_PROPERTIES,
  VIRTUAL_PROPERTIES,
} from '../constants';
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
}

export interface RefundAssetsPropInfo extends PropInfoBase {
  readonly type: 'refundAssets';
  readonly name: string;
}

export interface FunctionPropInfo extends PropInfoBase {
  readonly type: 'function';
  readonly name: string;
  readonly symbol: ts.Symbol;
  readonly decl: ts.PropertyDeclaration | ts.MethodDeclaration;
  readonly callSignature: ts.Signature | undefined;
  readonly send: boolean;
  readonly receive: boolean;
  readonly claim: boolean;
  readonly constant: boolean;
  readonly acceptsClaim: boolean;
  readonly returnType: ts.Type | undefined;
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

export type PropInfo = PropertyPropInfo | AccessorPropInfo | FunctionPropInfo | DeployPropInfo | RefundAssetsPropInfo;

export interface ContractInfo {
  readonly smartContract: ts.ClassDeclaration;
  readonly propInfos: ReadonlyArray<PropInfo>;
  readonly superSmartContract?: ContractInfo;
}

export class ContractInfoProcessor {
  public constructor(public readonly context: Context, public readonly smartContract: ts.ClassDeclaration) {}

  public process(): ContractInfo {
    if (tsUtils.modifier.isAbstract(this.smartContract)) {
      this.context.reportError(
        this.smartContract,
        DiagnosticCode.InvalidContract,
        DiagnosticMessage.InvalidContractAbstract,
      );
    }
    const result = this.processClass(this.smartContract, this.context.analysis.getType(this.smartContract));
    const finalPropInfos = result.propInfos.concat([
      {
        type: 'refundAssets',
        name: ContractPropertyName.refundAssets,
        classDecl: this.smartContract,
        isPublic: true,
      },
    ]);

    if (this.hasDeployInfo(result)) {
      return {
        ...result,
        propInfos: finalPropInfos,
      };
    }

    return {
      ...result,
      propInfos: finalPropInfos.concat([
        {
          type: 'deploy',
          name: ContractPropertyName.deploy,
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

    tsUtils.class_
      .getStaticMembers(classDecl)
      .map((member) => tsUtils.modifier.getStaticKeyword(member))
      .filter(utils.notNull)
      .forEach((keyword) => {
        this.context.reportError(
          keyword,
          DiagnosticCode.InvalidContractMethod,
          DiagnosticMessage.InvalidContractPropertyOrMethodStatic,
        );
      });

    _.flatMap(tsUtils.class_.getMembers(classDecl).map((member) => tsUtils.decoratable.getDecoratorsArray(member)))
      .filter((decorator) => !this.isValidDecorator(decorator))
      .forEach((decorator) => {
        this.context.reportError(decorator, DiagnosticCode.UnsupportedSyntax, DiagnosticMessage.UnsupportedDecorator);
      });

    _.flatMap(
      tsUtils.class_
        .getMethods(classDecl)
        .map((method) =>
          _.flatMap(
            tsUtils.parametered.getParameters(method).map((param) => tsUtils.decoratable.getDecoratorsArray(param)),
          ),
        ),
    )
      .filter((decorator) => !this.isValidDecorator(decorator))
      .forEach((decorator) => {
        this.context.reportError(decorator, DiagnosticCode.UnsupportedSyntax, DiagnosticMessage.UnsupportedDecorator);
      });

    _.flatMap(
      tsUtils.class_
        .getSetAccessors(classDecl)
        .map((method) =>
          _.flatMap(
            tsUtils.parametered.getParameters(method).map((param) => tsUtils.decoratable.getDecoratorsArray(param)),
          ),
        ),
    )
      .filter((decorator) => !this.isValidDecorator(decorator))
      .forEach((decorator) => {
        this.context.reportError(decorator, DiagnosticCode.UnsupportedSyntax, DiagnosticMessage.UnsupportedDecorator);
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
          name: ContractPropertyName.deploy,
          classDecl,
          decl: ctor,
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
            if (!this.context.builtins.isValue(decl, 'SmartContract')) {
              superSmartContract = this.processClass(decl, extendType);
            }
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
            name: ContractPropertyName.deploy,
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
    const nameNode = tsUtils.node.getNameNode(decl);
    if (!ts.isIdentifier(nameNode)) {
      this.context.reportError(
        nameNode,
        DiagnosticCode.InvalidContractProperty,
        DiagnosticMessage.InvalidContractPropertyIdentifier,
      );

      return undefined;
    }

    const name = tsUtils.symbol.getName(symbol);
    if (IGNORED_PROPERTIES.has(name)) {
      return undefined;
    }
    if (BUILTIN_PROPERTIES.has(name)) {
      const memberSymbol = this.context.builtins.getOnlyMemberSymbol('SmartContract', name);
      if (symbol !== memberSymbol) {
        this.context.reportError(
          nameNode,
          DiagnosticCode.InvalidContractProperty,
          DiagnosticMessage.InvalidContractPropertyReserved,
          name,
        );
      }

      return undefined;
    }
    if (RESERVED_PROPERTIES.has(name)) {
      const valueSymbol = this.context.builtins.getValueSymbol('SmartContract');
      const memberSymbol = tsUtils.symbol.getMemberOrThrow(valueSymbol, name);
      if (tsUtils.symbol.getTarget(symbol) !== memberSymbol) {
        this.context.reportError(
          nameNode,
          DiagnosticCode.InvalidContractProperty,
          DiagnosticMessage.InvalidContractPropertyReserved,
          name,
        );
      }

      return undefined;
    }
    if (VIRTUAL_PROPERTIES.has(name)) {
      this.context.reportError(
        nameNode,
        DiagnosticCode.InvalidContractMethod,
        DiagnosticMessage.InvalidContractMethodReserved,
        name,
      );

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

    const callSignatures = type.getCallSignatures();
    if (ts.isMethodDeclaration(decl) || (ts.isPropertyDeclaration(decl) && callSignatures.length > 0)) {
      if (callSignatures.length > 1) {
        this.context.reportError(
          decl,
          DiagnosticCode.InvalidContractMethod,
          DiagnosticMessage.InvalidContractMethodMultipleSignatures,
        );

        return undefined;
      }
      if (callSignatures.length === 0) {
        return undefined;
      }

      if (ts.isPropertyDeclaration(decl)) {
        const initializerProp = tsUtils.initializer.getInitializer(decl);
        const isReadonlyProp = tsUtils.modifier.isReadonly(decl);
        if (initializerProp === undefined || tsUtils.type_.getCallSignatures(type).length === 0 || !isReadonlyProp) {
          this.context.reportError(
            decl,
            DiagnosticCode.InvalidContractStorageType,
            DiagnosticMessage.InvalidContractStorageType,
          );

          return undefined;
        }
      }

      const callSignature = callSignatures[0];

      const send = this.hasSend(decl);
      const receive = this.hasReceive(decl);
      const claim = this.hasClaim(decl);
      const constant = this.hasConstant(decl);
      const requiresBoolean = send || receive || claim;

      if (requiresBoolean && constant) {
        const decorator = tsUtils.decoratable
          .getDecoratorsArray(decl)
          .find((dec) => this.isDecorator(dec, Decorator.constant));
        this.context.reportError(
          decorator === undefined ? decl : decorator,
          DiagnosticCode.InvalidContractMethod,
          DiagnosticMessage.InvalidContractMethodConstantNative,
        );

        return undefined;
      }

      const returnType = callSignatures.length >= 1 ? tsUtils.signature.getReturnType(callSignature) : undefined;
      if (returnType !== undefined && requiresBoolean && !isOnlyBoolean(this.context, decl, returnType)) {
        const decorator = tsUtils.decoratable
          .getDecoratorsArray(decl)
          .find(
            (dec) =>
              this.isDecorator(dec, Decorator.send) ||
              this.isDecorator(dec, Decorator.receive) ||
              this.isDecorator(dec, Decorator.claim),
          );
        this.context.reportError(
          decorator === undefined ? decl : decorator,
          DiagnosticCode.InvalidContractMethod,
          DiagnosticMessage.InvalidContractMethodNativeReturn,
        );

        return undefined;
      }

      return {
        type: 'function',
        name: tsUtils.node.getName(decl),
        classDecl,
        symbol: tsUtils.symbol.getTarget(symbol),
        decl,
        send,
        receive,
        claim,
        acceptsClaim: callSignatures.length >= 1 && this.isLastParamClaim(decl, callSignatures[0]),
        isPublic,
        callSignature,
        returnType,
        constant,
        isAbstract: !tsUtils.overload.isImplementation(decl),
      };
    }

    const structuredStorageType = STRUCTURED_STORAGE_TYPES.find((testType) =>
      this.context.builtins.isInterface(decl, type, testType),
    );
    const isReadonly = tsUtils.modifier.isReadonly(decl);
    const isAbstract = tsUtils.modifier.isAbstract(decl);
    const initializer = tsUtils.initializer.getInitializer(decl);
    if (structuredStorageType !== undefined && (isPublic || isAbstract || !isReadonly || initializer === undefined)) {
      this.context.reportError(
        decl,
        DiagnosticCode.InvalidStructuredStorageFor,
        DiagnosticMessage.InvalidStructuredStorageForProperty,
      );

      return undefined;
    }

    if (structuredStorageType === undefined && !this.context.analysis.isValidStorageType(decl, type)) {
      this.context.reportError(
        decl,
        DiagnosticCode.InvalidContractStorageType,
        DiagnosticMessage.InvalidContractStorageType,
      );

      return undefined;
    }

    return {
      type: 'property',
      symbol: tsUtils.symbol.getTarget(symbol),
      name: tsUtils.node.getName(decl),
      classDecl,
      decl,
      isPublic,
      propertyType: type,
      isReadonly,
      isAbstract,
      structuredStorageType,
    };
  }

  private hasConstant(decl: ClassInstanceMemberType | ts.ConstructorDeclaration): boolean {
    return this.hasDecorator(decl, Decorator.constant);
  }

  private hasSend(decl: ClassInstanceMemberType | ts.ConstructorDeclaration): boolean {
    return this.hasDecorator(decl, Decorator.send);
  }

  private hasReceive(decl: ClassInstanceMemberType | ts.ConstructorDeclaration): boolean {
    return this.hasDecorator(decl, Decorator.receive);
  }

  private hasClaim(decl: ClassInstanceMemberType | ts.ConstructorDeclaration): boolean {
    return this.hasDecorator(decl, Decorator.claim);
  }

  private hasDecorator(decl: ClassInstanceMemberType | ts.ConstructorDeclaration, name: Decorator): boolean {
    const decorators = tsUtils.decoratable.getDecorators(decl);

    return decorators === undefined ? false : decorators.some((decorator) => this.isDecorator(decorator, name));
  }

  private isValidDecorator(decorator: ts.Decorator): boolean {
    return DECORATORS_ARRAY.some((valid) => this.isDecorator(decorator, valid));
  }

  private isDecorator(decorator: ts.Decorator, name: Decorator): boolean {
    return this.context.builtins.isValue(tsUtils.expression.getExpression(decorator), name);
  }

  private isLastParamClaim(node: ts.Node, callSignature: ts.Signature): boolean {
    const signatureTypes = this.context.analysis.extractSignatureTypes(node, callSignature);
    if (signatureTypes === undefined) {
      return false;
    }

    if (signatureTypes.paramDecls.length === 0) {
      return false;
    }

    const param = signatureTypes.paramDecls[signatureTypes.paramDecls.length - 1];
    const paramType = signatureTypes.paramTypes.get(signatureTypes.paramDecls[signatureTypes.paramDecls.length - 1]);

    return paramType !== undefined && this.context.builtins.isInterface(param, paramType, 'ClaimTransaction');
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
