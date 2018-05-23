import { Node } from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { Name, Scope } from './Scope';
import { ProgramCounter } from '../pc';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as constants from '../../constants';

class IdentifierName implements Name {
  public nameBrand: number = 0;
  constructor(public readonly value: string) {}
}

export class ResolvedScope implements Scope {
  private position: number = 0;
  private variables: { [name: string]: number } = {};
  private uniqueVariables: Map<Name, number> = new Map();
  private scopeLength: number;
  private addScope: boolean;
  private scopeCount: number;

  constructor(
    private readonly variableCount: number,
    private readonly parent?: ResolvedScope | undefined,
  ) {
    if (this.parent == null) {
      this.addScope = true;
      this.scopeCount = 1;
      this.scopeLength = 1;
    } else {
      this.addScope = variableCount > 0;
      this.scopeCount = this.addScope ? 1 : 0;
      this.scopeLength = this.parent.scopeLength + this.scopeCount;
    }
  }

  public add(name: string): Name {
    const identifier = new IdentifierName(name);
    const existing = this.variables[name];
    if (existing != null) {
      return identifier;
    }

    this.variables[identifier.value] = this.position;
    this.position += 1;
    if (this.position > this.variableCount) {
      throw new Error(
        `Something went wrong. Name: ${name} Position: ${
          this.position
        } Count: ${this.variableCount}`,
      );
    }
    return identifier;
  }

  public addUnique(): Name {
    const name = { nameBrand: 0 };
    this.uniqueVariables.set(name, this.position);
    this.position += 1;
    if (this.position > this.variableCount) {
      throw new Error(
        `Something went wrong. Position: ${this.position} Count: ${
          this.variableCount
        }`,
      );
    }
    return name;
  }

  // [value]
  public set(
    sb: ScriptBuilder,
    node: Node,
    optionsIn: VisitOptions,
    name: Name | string,
    scopeLength: number = this.scopeLength,
    scopePosition: number = 0,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    const position = this.getPosition(name);
    if (position == null) {
      if (this.parent == null) {
        sb.reportError(
          node,
          `Unknown reference: ${name}`,
          DiagnosticCode.REFERENCE_ERROR,
        );
      } else {
        this.parent.set(
          sb,
          node,
          options,
          name,
          scopeLength,
          scopePosition + this.scopeCount,
        );
      }
    } else {
      // [normal]
      sb.emitHelper(node, options, sb.helpers.createNormalCompletion);
      // [scope, normal]
      this.loadScope(sb, node, scopeLength, scopePosition);
      // [position, scope, normal]
      sb.emitPushInt(node, position);
      // [normal, position, scope]
      sb.emitOp(node, 'ROT');
      // []
      sb.emitOp(node, 'SETITEM');
    }
  }

  public get(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    name: Name | string,
    scopeLength: number = this.scopeLength,
    scopePosition: number = 0,
  ): void {
    const position = this.getPosition(name);
    if (position == null) {
      if (this.parent == null) {
        if (typeof name === 'string' && sb.helpers.globalProperties.has(name)) {
          // [val]
          sb.emitHelper(
            node,
            options,
            sb.helpers.getGlobalProperty({ property: name }),
          );
        } else {
          sb.reportError(
            node,
            `Unknown reference: ${name}`,
            DiagnosticCode.REFERENCE_ERROR,
          );
        }
      } else {
        this.parent.get(
          sb,
          node,
          options,
          name,
          scopeLength,
          scopePosition + this.scopeCount,
        );
      }
    } else {
      this.loadScope(sb, node, scopeLength, scopePosition);
      sb.emitPushInt(node, position);
      sb.emitOp(node, 'PICKITEM');
      sb.emitHelper(node, options, sb.helpers.pickCompletionVal);
    }
  }

  public getThis(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [[scopes, this]]
    this.loadAll(sb, node);
    // [1, [scopes, this]]
    sb.emitPushInt(node, 1);
    // [this]
    sb.emitOp(node, 'PICKITEM');
  }

  public setThis(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [[scopes, this], val]
    this.loadAll(sb, node);
    // [1, [scopes, this], val]
    sb.emitPushInt(node, 1);
    // [val, 1, [scopes, this]]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public getGlobal(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (this.parent == null) {
      // [[scopes, this, global]]
      this.loadAll(sb, node);
      // [2, [scopes, this, global]]
      sb.emitPushInt(node, 2);
      // [this]
      sb.emitOp(node, 'PICKITEM');
    } else {
      this.parent.getGlobal(sb, node, options);
    }
  }

  public setGlobal(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (this.parent == null) {
      // [[scopes, this, global], val]
      this.loadAll(sb, node);
      // [[scopes, this, global], val, [scopes, this, global]]
      sb.emitOp(node, 'TUCK');
      // [val, [scopes, this, global], val, [scopes, this, global]]
      sb.emitOp(node, 'OVER');
      // [2, val, [scopes, this, global], val, [scopes, this, global]]
      sb.emitPushInt(node, 2);
      // [val, 2, [scopes, this, global], val, [scopes, this, global]]
      sb.emitOp(node, 'SWAP');
      // [val, [scopes, this, global]]
      sb.emitOp(node, 'SETITEM');
      // [1, val, [scopes, this, global]]
      sb.emitPushInt(node, 1);
      // [val, 1, [scopes, this, global]]
      sb.emitOp(node, 'SWAP');
      // []
      sb.emitOp(node, 'SETITEM');
    } else {
      this.parent.setGlobal(sb, node, options);
    }
  }

  public hasBinding(name: string): boolean {
    return (
      this.variables[name] != null ||
      (this.parent != null && this.parent.hasBinding(name))
    );
  }

  public pushAll(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    sb.emitOp(node, 'DUPFROMALTSTACK');
  }

  public emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ): void {
    if (this.addScope) {
      this.surround(sb, node, options, func);
    } else {
      func(options);
    }
  }

  private surround(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ): void {
    if (this.parent == null) {
      // [global]
      sb.emitHelper(
        node,
        sb.pushValueOptions(options),
        sb.helpers.createUndefined,
      );
      // [this, global]
      sb.emitHelper(
        node,
        sb.pushValueOptions(options),
        sb.helpers.createUndefined,
      );
      // [0, this, global]
      sb.emitPushInt(node, 0);
      // [scopes, this, global]
      sb.emitOp(node, 'NEWSTRUCT');
      // [3, scopes, this, global]
      sb.emitPushInt(node, 3);
      // [[scopes, this, global]]
      sb.emitOp(node, 'PACK');
      // [[scopes, this, global], [scopes, this, global]]
      sb.emitOp(node, 'DUP');
      // [[scopes, this, global]]
      sb.emitOp(node, 'TOALTSTACK');
    } else {
      // [[scopes, this]]
      sb.emitOp(node, 'DUPFROMALTSTACK');
    }
    // [0, [scopes, this]]
    sb.emitPushInt(node, 0);
    // [scopes]
    sb.emitOp(node, 'PICKITEM');
    // [0, scopes]
    sb.emitPushInt(node, 0);
    // [scope, scopes]
    sb.emitOp(node, 'NEWARRAY');
    // [idx, scope, scopes]
    sb.emitPushInt(node, 0);
    sb.withProgramCounter((loopPC) => {
      // [idx, idx, scope, scopes]
      sb.emitOp(node, 'DUP');
      // [count, idx, idx, scope, scopes]
      sb.emitPushInt(node, this.variableCount);
      // [idx < count, idx, scope, scopes]
      sb.emitOp(node, 'LT');
      // [idx, scope, scopes]
      sb.emitJmp(node, 'JMPIFNOT', loopPC.getLast());
      // [scope, idx, scope, scopes]
      sb.emitOp(node, 'OVER');
      // [errorString, scope, idx, scope, scopes]
      sb.emitPushString(node, 'Referenced variable before it was defined');
      // [error, scope, idx, scope, scopes]
      sb.emitHelper(
        node,
        sb.pushValueOptions(options),
        sb.helpers.createString,
      );
      // [throw, scope, idx, scope, scopes]
      sb.emitHelper(
        node,
        sb.pushValueOptions(options),
        sb.helpers.createThrowCompletion,
      );
      // [idx, scope, scopes]
      sb.emitOp(node, 'APPEND');
      // [idx, scope, scopes]
      sb.emitOp(node, 'INC');
      // [idx, scope, scopes]
      sb.emitJmp(node, 'JMP', loopPC.getFirst());
    });
    // [scope, scopes]
    sb.emitOp(node, 'DROP');
    // []
    sb.emitOp(node, 'APPEND');

    const { breakPC, continuePC, catchPC } = options;
    const nonLocal = breakPC != null || continuePC != null || catchPC != null;
    sb.withProgramCounter((pc) => {
      let innerOptions = options;
      if (breakPC != null) {
        innerOptions = sb.breakPCOptions(innerOptions, pc.getLast());
      }

      if (continuePC != null) {
        innerOptions = sb.continuePCOptions(innerOptions, pc.getLast());
      }

      if (catchPC != null) {
        innerOptions = sb.catchPCOptions(innerOptions, pc.getLast());
      }

      func(innerOptions);
      if (nonLocal) {
        sb.emitPushInt(node, constants.NORMAL_COMPLETION);
      }
    });

    if (this.parent == null) {
      // [[scopes, undefined]]
      sb.emitOp(node, 'FROMALTSTACK');
      sb.emitOp(node, 'DROP');
    } else {
      // [[scopes, undefined]]
      sb.emitOp(node, 'DUPFROMALTSTACK');
      // [0, [scopes, undefined]]
      sb.emitPushInt(node, 0);
      // [scopes]
      sb.emitOp(node, 'PICKITEM');
      // [scopes, scopes]
      sb.emitOp(node, 'DUP');
      // [size, scopes]
      sb.emitOp(node, 'ARRAYSIZE');
      // [size - 1, scopes]
      sb.emitOp(node, 'DEC');
      // []
      sb.emitOp(node, 'REMOVE');
    }

    this.emitNonLocal(sb, node, constants.BREAK_COMPLETION, breakPC);
    this.emitNonLocal(sb, node, constants.CONTINUE_COMPLETION, continuePC);
    this.emitNonLocal(sb, node, constants.CATCH_COMPLETION, catchPC);

    if (nonLocal) {
      sb.emitOp(node, 'DROP');
    }
  }

  private emitNonLocal(
    sb: ScriptBuilder,
    node: Node,
    completion: number,
    pc: ProgramCounter | undefined,
  ): void {
    if (pc != null) {
      sb.withProgramCounter((innerPC) => {
        sb.emitOp(node, 'DUP');
        sb.emitPushInt(node, completion);
        sb.emitOp(node, 'NUMEQUAL');
        sb.emitJmp(node, 'JMPIF', pc);
      });
    }
  }

  private getPosition(name: Name | string): number | null | undefined {
    if (typeof name === 'string') {
      return this.variables[name];
    } else if (name instanceof IdentifierName) {
      return this.variables[name.value];
    }

    return this.uniqueVariables.get(name);
  }

  private loadScope(
    sb: ScriptBuilder,
    node: Node,
    scopeLength: number,
    scopePosition: number,
  ): void {
    this.loadAll(sb, node);
    // [0,[scopes, this]]
    sb.emitPushInt(node, 0);
    // [scopes]
    sb.emitOp(node, 'PICKITEM');
    // [scopeIndex, scopes]
    sb.emitPushInt(node, scopeLength - scopePosition - 1);
    // [scope]
    sb.emitOp(node, 'PICKITEM');
  }

  private loadAll(sb: ScriptBuilder, node: Node): void {
    // [[scopes, this]]
    sb.emitOp(node, 'DUPFROMALTSTACK');
  }
}
