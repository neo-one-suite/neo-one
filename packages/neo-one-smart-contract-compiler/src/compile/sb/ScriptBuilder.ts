// tslint:disable ban-types
import { OpCode, SysCallName } from '@neo-one/client-core';
import { BN } from 'bn.js';
import ts from 'typescript';
import { Context, DiagnosticOptions } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import { Globals } from '../../symbols';
import { BuiltIns, BuiltInSymbols } from '../builtins';
import { Helper, Helpers } from '../helper';
import { Jump, Line, ProgramCounter, ProgramCounterHelper } from '../pc';
import { Name, Scope } from '../scope';
import { VisitOptions } from '../types';
import { JumpTable } from './JumpTable';

export type SingleBytecodeValue = Buffer | Jump | Line;
export type SingleBytecode = [ts.Node, SingleBytecodeValue];
export type Bytecode = ReadonlyArray<SingleBytecode>;

export interface CaptureResult {
  readonly length: number;
  readonly bytecode: Bytecode;
}

export interface ScriptBuilder {
  readonly program: ts.Program;
  readonly typeChecker: ts.TypeChecker;
  readonly languageService: ts.LanguageService;
  readonly builtIns: BuiltIns;
  readonly builtInSymbols: BuiltInSymbols;
  readonly context: Context;
  readonly scope: Scope;
  readonly moduleIndex: number;
  readonly helpers: Helpers;
  readonly jumpTable: JumpTable;
  readonly process: () => void;
  readonly visit: (node: ts.Node, options: VisitOptions) => void;
  readonly withScope: (node: ts.Node, options: VisitOptions, func: (options: VisitOptions) => void) => void;
  readonly withProgramCounter: (func: (pc: ProgramCounterHelper) => void) => void;
  readonly emitOp: (node: ts.Node, code: OpCode, value?: Buffer) => void;
  readonly emitPushInt: (node: ts.Node, value: number | BN) => void;
  readonly emitPushBoolean: (node: ts.Node, value: boolean) => void;
  readonly emitPushString: (node: ts.Node, value: string) => void;
  readonly emitPushBuffer: (node: ts.Node, value: Buffer) => void;
  readonly emitJmp: (node: ts.Node, code: 'JMP' | 'JMPIF' | 'JMPIFNOT', pc: ProgramCounter) => void;
  readonly emitHelper: <T extends ts.Node>(node: T, options: VisitOptions, helper: Helper<T>) => void;
  readonly emitBytecode: (bytecode: Bytecode) => void;
  readonly emitCall: (node: ts.Node) => void;
  readonly emitSysCall: (node: ts.Node, name: SysCallName) => void;
  readonly emitLine: (node: ts.Node) => void;
  readonly loadModule: (node: ts.SourceFile) => void;
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
  readonly noCatchPCOptions: (options: VisitOptions) => VisitOptions;
  readonly finallyPCOptions: (options: VisitOptions, pc: ProgramCounter) => VisitOptions;
  readonly castOptions: (options: VisitOptions, type?: ts.Type) => VisitOptions;
  readonly noCastOptions: (options: VisitOptions) => VisitOptions;
  readonly superClassOptions: (options: VisitOptions, superClass: Name) => VisitOptions;
  readonly noSuperClassOptions: (options: VisitOptions) => VisitOptions;
  readonly reportError: (node: ts.Node, message: string, code: DiagnosticCode) => void;
  readonly reportUnsupported: (node: ts.Node) => void;
  readonly getType: (node: ts.Node, options?: DiagnosticOptions) => ts.Type | undefined;
  readonly getSymbol: (node: ts.Node, options?: DiagnosticOptions) => ts.Symbol | undefined;
  readonly isOnlyGlobal: (node: ts.Node, type: ts.Type | undefined, name: keyof Globals) => boolean;
  readonly isGlobal: (node: ts.Node, type: ts.Type | undefined, name: keyof Globals) => boolean;
  readonly hasGlobal: (node: ts.Node, type: ts.Type | undefined, name: keyof Globals) => boolean;
  readonly isGlobalSymbol: (node: ts.Node, symbol: ts.Symbol | undefined, name: keyof Globals) => boolean;
  readonly hasExport: (sourceFile: ts.SourceFile, name: string) => boolean;
  readonly addExport: (name: string) => void;
}
