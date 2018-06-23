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

export type SingleBytecode = [Node, Buffer | Jump];
export type Bytecode = ReadonlyArray<SingleBytecode>;

export interface CaptureResult {
  readonly length: number;
  readonly bytecode: Bytecode;
}

export interface ScriptBuilder {
  readonly scope: Scope;
  readonly moduleIndex: number;
  readonly helpers: Helpers;
  readonly jumpTable: JumpTable;
  readonly process: () => void;
  readonly visit: (node: Node, options: VisitOptions) => void;
  readonly withScope: (node: Node, options: VisitOptions, func: (options: VisitOptions) => void) => void;
  readonly withProgramCounter: (func: (pc: ProgramCounterHelper) => void) => void;
  readonly emitOp: (node: Node, code: OpCode, value?: Buffer) => void;
  readonly emitPushInt: (node: Node, value: number | BN) => void;
  readonly emitPushBoolean: (node: Node, value: boolean) => void;
  readonly emitPushString: (node: Node, value: string) => void;
  readonly emitJmp: (node: Node, code: 'JMP' | 'JMPIF' | 'JMPIFNOT', pc: ProgramCounter) => void;
  readonly emitHelper: <T extends Node>(node: T, options: VisitOptions, helper: Helper<T>) => void;
  readonly emitBytecode: (bytecode: Bytecode) => void;
  readonly emitCall: (node: Node) => void;
  readonly emitSysCall: (node: Node, name: SysCallName) => void;
  readonly loadModule: (node: SourceFile) => void;
  readonly capture: (func: () => void) => CaptureResult;
  readonly toBuffer: (value: string) => Buffer;
  readonly plainOptions: (options: VisitOptions) => VisitOptions;
  readonly pushValueOptions: (options: VisitOptions) => VisitOptions;
  readonly noPushValueOptions: (options: VisitOptions) => VisitOptions;
  readonly setValueOptions: (options: VisitOptions) => VisitOptions;
  readonly noSetValueOptions: (options: VisitOptions) => VisitOptions;
  readonly noValueOptions: (options: VisitOptions) => VisitOptions;
  readonly breakPCOptions: (options: VisitOptions, pc: ProgramCounter) => VisitOptions;
  readonly continuePCOptions: (options: VisitOptions, pc: ProgramCounter) => VisitOptions;
  readonly catchPCOptions: (options: VisitOptions, pc: ProgramCounter) => VisitOptions;
  readonly castOptions: (options: VisitOptions, type?: Type) => VisitOptions;
  readonly noCastOptions: (options: VisitOptions) => VisitOptions;
  readonly superClassOptions: (options: VisitOptions, superClass: Name) => VisitOptions;
  readonly noSuperClassOptions: (options: VisitOptions) => VisitOptions;
  readonly reportError: (node: Node, message: string, code: DiagnosticCode) => void;
  readonly reportUnsupported: (node: Node) => void;
  readonly getType: (node: Node, required?: boolean) => Type | undefined;
  readonly getSymbol: (node: Node, required?: boolean) => Symbol | undefined;
  readonly isOnlyGlobal: (node: Node, type: Type | undefined, name: keyof Globals) => boolean;
  readonly isGlobal: (node: Node, type: Type | undefined, name: keyof Globals) => boolean;
  readonly hasGlobal: (node: Node, type: Type | undefined, name: keyof Globals) => boolean;
  readonly isGlobalSymbol: (node: Node, symbol: Symbol | undefined, name: keyof Globals) => boolean;
  readonly hasExport: (sourceFile: SourceFile, name: string) => boolean;
  readonly addExport: (name: string) => void;
}
