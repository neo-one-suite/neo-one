import { addressToScriptHash } from '@neo-one/client';
import { common, ECPoint, UInt160, UInt256 } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { Context, DEFAULT_DIAGNOSTIC_OPTIONS, DiagnosticOptions } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import { createMemoized, nodeKey } from '../utils';

export interface SignatureTypes {
  readonly paramDecls: ReadonlyArray<ts.ParameterDeclaration>;
  readonly paramTypes: Map<ts.ParameterDeclaration, ts.Type | undefined>;
  readonly returnType: ts.Type | undefined;
}

export class AnalysisService {
  private readonly memoized = createMemoized();
  public constructor(private readonly context: Context) {}

  public getFunctionReturnType(
    node: ts.SignatureDeclaration,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Type | undefined {
    if (ts.isAccessor(node)) {
      return this.context.getType(node, options);
    }

    const typeNode = tsUtils.type_.getTypeNode(node) as ts.TypeNode | undefined;
    if (typeNode !== undefined) {
      return tsUtils.type_.getTypeFromTypeNode(this.context.typeChecker, typeNode);
    }

    const signatureTypes = this.extractSignature(node, options);

    return signatureTypes === undefined ? undefined : signatureTypes.returnType;
  }

  public extractSignature(
    node: ts.Node,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): SignatureTypes | undefined {
    return this.extractSignatureForType(node, this.context.getType(node, options), options);
  }

  public getSignatures(
    node: ts.CallLikeExpression,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ReadonlyArray<ts.Signature> | undefined {
    const signature = this.context.typeChecker.getResolvedSignature(node);
    if (signature !== undefined && !tsUtils.signature.isFailure(signature)) {
      return [signature];
    }
    const expr = tsUtils.expression.getExpressionForCall(node);
    const type = this.context.getType(expr, options);
    if (type === undefined) {
      return undefined;
    }

    return tsUtils.type_.getCallSignatures(type);
  }

  public extractSignatureForType(
    node: ts.Node,
    type: ts.Type | undefined,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): SignatureTypes | undefined {
    const signatures = type === undefined ? undefined : tsUtils.type_.getCallSignatures(type);
    if (signatures === undefined) {
      return undefined;
    }

    if (signatures.length === 0) {
      return undefined;
    }

    if (signatures.length !== 1) {
      this.report(options, node, DiagnosticCode.MultipleSignatures, DiagnosticMessage.MultipleSignatures);

      return undefined;
    }

    return this.extractSignatureTypes(node, signatures[0], options);
  }

  public extractSignaturesForCall(
    node: ts.CallLikeExpression,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ReadonlyArray<SignatureTypes> | undefined {
    const signatures = this.getSignatures(node, options);
    if (signatures === undefined) {
      return undefined;
    }

    return signatures.map((signature) => this.extractSignatureTypes(node, signature, options)).filter(utils.notNull);
  }

  public extractSignatureTypes(
    node: ts.Node,
    signature: ts.Signature,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): SignatureTypes | undefined {
    const params = tsUtils.signature.getParameters(signature);
    const paramTypes = params.map((param) => this.context.getTypeOfSymbol(param, node, { error: true }));
    const paramDeclsNullable = params.map((param) => tsUtils.symbol.getValueDeclaration(param));
    const nullParamIndex = paramDeclsNullable.indexOf(undefined);
    if (nullParamIndex !== -1) {
      /* istanbul ignore next */
      const nullParam = params[nullParamIndex];
      /* istanbul ignore next */
      this.report(
        options,
        node,
        DiagnosticCode.Invariant,
        DiagnosticMessage.MissingParameterDeclaration,
        tsUtils.symbol.getName(nullParam),
      );

      /* istanbul ignore next */
      return undefined;
    }

    const paramDecls = paramDeclsNullable.filter(utils.notNull).filter(ts.isParameter);

    const declToType = new Map<ts.ParameterDeclaration, ts.Type | undefined>();
    // tslint:disable-next-line no-loop-statement
    for (const [paramDecl, paramType] of utils.zip(paramDecls, paramTypes)) {
      declToType.set(paramDecl, paramType);
    }

    return {
      paramDecls,
      paramTypes: declToType,
      returnType: this.context.getNotAnyType(node, tsUtils.signature.getReturnType(signature), { error: true }),
    };
  }

  public extractLiteralAddress(original: ts.Expression): UInt160 | undefined {
    return this.memoized('extract-literal-address', nodeKey(original), () =>
      this.extractLiteral(
        original,
        'AddressConstructor',
        (value) => {
          try {
            return common.stringToUInt160(addressToScriptHash(value));
          } catch {
            return common.stringToUInt160(value);
          }
        },
        common.bufferToUInt160,
      ),
    );
  }

  public extractLiteralHash256(original: ts.Expression): UInt256 | undefined {
    return this.extractLiteral(original, 'Hash256Constructor', common.stringToUInt256, common.bufferToUInt256);
  }

  public extractLiteralPublicKey(original: ts.Expression): ECPoint | undefined {
    return this.extractLiteral(original, 'PublicKeyConstructor', common.stringToECPoint, common.bufferToECPoint);
  }

  private extractLiteral<T>(
    original: ts.Expression,
    name: string,
    processText: (value: string) => T,
    processBuffer: (value: Buffer) => T,
  ): T | undefined {
    return this.traceIdentifier(original, (node) => {
      if (!ts.isCallExpression(node) && !ts.isTaggedTemplateExpression(node)) {
        return undefined;
      }

      const expr = ts.isCallExpression(node) ? tsUtils.expression.getExpression(node) : tsUtils.template.getTag(node);
      const symbol = this.context.getSymbol(expr);
      const hash256From = this.context.builtins.getOnlyMemberSymbol(name, 'from');
      const bufferFrom = this.context.builtins.getOnlyMemberSymbol('BufferConstructor', 'from');

      if (symbol === hash256From) {
        const arg = ts.isCallExpression(node)
          ? (tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined)
          : tsUtils.template.getTemplate(node);
        if (
          ts.isTaggedTemplateExpression(node) &&
          !ts.isNoSubstitutionTemplateLiteral(tsUtils.template.getTemplate(node))
        ) {
          return undefined;
        }
        if (arg === undefined) {
          return undefined;
        }

        return this.traceIdentifier(arg, (value) => {
          if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
            try {
              return processText(tsUtils.literal.getLiteralValue(value));
            } catch {
              // do nothing
            }
          }

          return undefined;
        });
      }

      if (symbol === bufferFrom && ts.isCallExpression(node)) {
        const arg = tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined;
        if (arg === undefined) {
          return undefined;
        }

        return this.traceIdentifier(arg, (value) => {
          if (!ts.isStringLiteral(value)) {
            return undefined;
          }

          try {
            return processBuffer(Buffer.from(tsUtils.literal.getLiteralValue(value), 'hex'));
          } catch {
            return undefined;
          }
        });
      }

      return undefined;
    });
  }

  private traceIdentifier<T>(
    nodeIn: ts.Expression,
    extractValue: (value: ts.Expression) => T | undefined,
  ): T | undefined {
    const node = this.unwrapExpression(nodeIn);

    if (ts.isIdentifier(node)) {
      const symbol = this.context.getSymbol(node);
      if (symbol === undefined) {
        return undefined;
      }

      const decl = tsUtils.symbol.getValueDeclaration(symbol);
      if (decl === undefined) {
        return undefined;
      }

      if (!ts.isVariableDeclaration(decl)) {
        return undefined;
      }

      const parent = tsUtils.node.getParent(decl);
      if (!ts.isVariableDeclarationList(parent) || !tsUtils.modifier.isConst(parent)) {
        return undefined;
      }

      const initializer = tsUtils.initializer.getInitializer(parent);
      if (initializer === undefined) {
        return undefined;
      }

      return this.traceIdentifier(initializer, extractValue);
    }

    return extractValue(node);
  }

  private unwrapExpression(node: ts.Expression): ts.Expression {
    if (ts.isParenthesizedExpression(node)) {
      return tsUtils.expression.getExpression(node);
    }

    if (ts.isAsExpression(node)) {
      return tsUtils.expression.getExpression(node);
    }

    return node;
  }

  private report(
    options: DiagnosticOptions,
    node: ts.Node,
    code: DiagnosticCode,
    message: DiagnosticMessage,
    // tslint:disable-next-line no-any readonly-array
    ...args: any[]
  ): void {
    if (options.error) {
      this.context.reportError(node, code, message, ...args);
    } else if (options.warning) {
      this.context.reportWarning(node, code, message, ...args);
    }
  }
}
