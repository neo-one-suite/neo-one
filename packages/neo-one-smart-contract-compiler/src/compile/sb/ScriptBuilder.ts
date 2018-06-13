// tslint:disable ban-types
import { OpCode, SysCallName } from '@neo-one/client-core';
import BN from 'bn.js';
import { Node, SourceFile, Symbol, Type } from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { Globals } from '../../symbols';
import { Helper, Helpers } from '../helper';
import { Jump, ProgramCounter, ProgramCounterHelper } from '../pc';
import { Name, Scope } from '../scope';
import { VisitOptions } from '../types';
import { JumpTable } from './JumpTable';

export type Bytecode = Array<[Node, Buffer | Jump]>;

export interface CaptureResult {
  length: number;
  bytecode: Bytecode;
}

export interface ScriptBuilder {
  scope: Scope;
  moduleIndex: number;
  helpers: Helpers;
  jumpTable: JumpTable;
  process(): void;
  visit(node: Node, options: VisitOptions): void;
  withScope(
    node: Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ): void;
  withProgramCounter(func: (pc: ProgramCounterHelper) => void): void;
  emitOp(node: Node, code: OpCode): void;
  emitPushInt(node: Node, value: number | BN): void;
  emitPushBoolean(node: Node, value: boolean): void;
  emitPushString(node: Node, value: string): void;
  emitJmp(
    node: Node,
    code: 'JMP' | 'JMPIF' | 'JMPIFNOT',
    pc: ProgramCounter,
  ): void;
  emitHelper<T extends Node>(
    node: T,
    options: VisitOptions,
    helper: Helper<T>,
  ): void;
  emitBytecode(bytecode: Bytecode): void;
  emitCall(node: Node): void;
  emitSysCall(node: Node, name: SysCallName): void;
  loadModule(node: SourceFile): void;
  capture(func: () => void): CaptureResult;
  toBuffer(value: string): Buffer;
  plainOptions(options: VisitOptions): VisitOptions;
  pushValueOptions(options: VisitOptions): VisitOptions;
  noPushValueOptions(options: VisitOptions): VisitOptions;
  setValueOptions(options: VisitOptions): VisitOptions;
  noSetValueOptions(options: VisitOptions): VisitOptions;
  noValueOptions(options: VisitOptions): VisitOptions;
  breakPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions;
  continuePCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions;
  catchPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions;
  castOptions(options: VisitOptions, type?: Type): VisitOptions;
  noCastOptions(options: VisitOptions): VisitOptions;
  superClassOptions(options: VisitOptions, superClass: Name): VisitOptions;
  noSuperClassOptions(options: VisitOptions): VisitOptions;
  reportError(node: Node, message: string, code: DiagnosticCode): void;
  reportUnsupported(node: Node): void;
  getType(node: Node, required?: boolean): Type | undefined;
  getSymbol(node: Node, required?: boolean): Symbol | undefined;
  isOnlyGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean;
  isGlobal(node: Node, type: Type | undefined, name: keyof Globals): boolean;
  isGlobalSymbol(
    node: Node,
    symbol: Symbol | undefined,
    name: keyof Globals,
  ): boolean;
  hasExport(sourceFile: SourceFile, name: string): boolean;
  addExport(name: string): void;
  assertUnreachable(value: never): never;
  assertNotNull<T>(value: T | undefined | null): T;
}
