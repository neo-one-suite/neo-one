// tslint:disable ban-types
import {
  BYTECODE_TO_BYTECODE_BUFFER,
  OPCODE_TO_BYTECODE,
  BinaryWriter,
  ByteCode,
  OpCode,
  UnknownOpError,
  utils,
  ScriptBuilder as ClientScriptBuilder,
  SysCallName,
} from '@neo-one/client-core';
import BN from 'bn.js';
import Ast, { Node, SourceFile, Type, Symbol } from 'ts-simple-ast';

import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import { Helper, Helpers } from '../helper';
import { JumpTable } from './JumpTable';
import {
  DeferredProgramCounter,
  ProgramCounterHelper,
  ProgramCounter,
  Jump,
  Jmp,
  Call,
} from '../pc';
import { NodeCompiler } from '../NodeCompiler';
import { Scope, Name } from '../scope';
import { Bytecode, CaptureResult, ScriptBuilder } from './ScriptBuilder';
import { VisitOptions } from '../types';

import declarations from '../declaration';
import decorator from '../decorator';
import expression from '../expression';
import file from '../file';
import statement from '../statement';
import { Globals } from '../../symbols';
import { JumpResolver } from './JumpResolver';

const compilers = [declarations, decorator, expression, file, statement];

interface Compilers {
  [kind: number]: NodeCompiler<any>;
}

export abstract class BaseScriptBuilder<TScope extends Scope>
  implements ScriptBuilder {
  public readonly jumpTable: JumpTable = new JumpTable();
  private currentScope: TScope | undefined;
  private readonly compilers: Compilers;
  private bytecode: Bytecode;
  private pc: number;
  private jumpTablePC: DeferredProgramCounter = new DeferredProgramCounter();
  private capturedBytecode: Bytecode | undefined = undefined;
  private readonly nodes: Map<Node, number> = new Map();
  private readonly moduleMap: { [filePath: string]: number } = {};
  private readonly reverseModuleMap: { [index: number]: string } = {};
  private readonly exportMap: { [filePath: string]: Set<string> } = {};
  private nextModuleIndex = 0;
  private currentModuleIndex = 0;

  constructor(
    private readonly context: Context,
    public readonly helpers: Helpers,
    protected readonly ast: Ast,
    private readonly sourceFile: SourceFile,
    private readonly allHelpers: Helper[] = [],
  ) {
    this.bytecode = [];
    this.pc = 0;
    this.currentScope = undefined;
    this.compilers = (compilers as Array<Array<new () => NodeCompiler<any>>>)
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
        {} as Compilers,
      );
  }

  get scope(): TScope {
    if (this.currentScope == null) {
      throw new Error('Scope has not been set');
    }
    return this.currentScope;
  }

  get moduleIndex(): number {
    return this.currentModuleIndex;
  }

  public process(): void {
    const sourceFile = this.sourceFile;
    const { bytecode } = this.capture(() => {
      this.moduleMap[sourceFile.getFilePath()] = this.nextModuleIndex;
      this.reverseModuleMap[this.nextModuleIndex] = sourceFile.getFilePath();
      this.currentModuleIndex = this.nextModuleIndex;
      this.nextModuleIndex += 1;

      this.currentScope = this.createScope(sourceFile, 0, undefined);
      this.nodes.set(sourceFile, 0);
      const options = {};
      this.currentScope.emit(this, sourceFile, options, (innerOptions) => {
        // []
        this.emitHelper(
          sourceFile,
          this.pushValueOptions(options),
          this.helpers.setGlobalObject,
        );
        // [globalObjectVal]
        this.scope.getGlobal(this, sourceFile, this.pushValueOptions(options));
        // []
        this.emitHelper(
          sourceFile,
          this.pushValueOptions(options),
          this.helpers.addEmptyModule,
        );
        // []
        this.allHelpers.forEach((helper) => {
          helper.emitGlobal(this, sourceFile, innerOptions);
        });
        this.visit(sourceFile, innerOptions);
      });
    });

    this.withProgramCounter((pc) => {
      this.emitJmp(sourceFile, 'JMP', pc.getLast());
      this.jumpTablePC.setPC(pc.getCurrent());
      this.jumpTable.emitTable(this, sourceFile);
    });
    this.emitBytecode(bytecode);
  }

  public getFinalBytecode(): Buffer {
    const bytecode = new JumpResolver().process(
      this.bytecode.map(([_, value]) => value),
    );
    let pc = 0;
    const buffers = bytecode.map((valueIn) => {
      let value = valueIn;
      if (value instanceof Jump) {
        const offsetPC = new BN(value.pc.getPC()).sub(new BN(pc));
        // @ts-ignore
        const jumpPC = offsetPC.toTwos(16);
        const byteCodeBuffer =
          BYTECODE_TO_BYTECODE_BUFFER[OPCODE_TO_BYTECODE[value.op]];
        if (byteCodeBuffer == null) {
          throw new Error(
            'Something went wrong, could not find bytecode buffer',
          );
        }
        value = Buffer.concat([
          byteCodeBuffer,
          jumpPC.toArrayLike(Buffer, 'le', 2),
        ]);
      }

      pc += value.length;
      return value;
    }) as Buffer[];

    return Buffer.concat(buffers);
  }

  public visit(node: Node, options: VisitOptions): void {
    const compiler = this.compilers[node.compilerNode.kind];
    if (compiler == null) {
      this.reportUnsupported(node);
    } else {
      compiler.visitNode(this, node, options);
    }
  }

  public withScope(
    node: Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ): void {
    let index = this.nodes.get(node);
    if (index == null) {
      index = 0;
    } else {
      index += 1;
    }

    this.nodes.set(node, index);

    const currentScope = this.currentScope;
    this.currentScope = this.createScope(node, index, currentScope);
    this.currentScope.emit(this, node, options, func);
    this.currentScope = currentScope;
  }

  public withProgramCounter(func: (pc: ProgramCounterHelper) => void): void {
    const pc = new ProgramCounterHelper(() => this.pc);
    func(pc);
    pc.setLast();
  }

  public emitOp(
    node: Node,
    code: OpCode,
    buffer?: Buffer | null | undefined,
  ): void {
    const bytecode = OPCODE_TO_BYTECODE[code];
    if (bytecode == null) {
      throw new UnknownOpError(code);
    }
    this.emitOpByte(node, bytecode, buffer);
  }

  public emitPushInt(node: Node, valueIn: number | BN): void {
    const value = new BN(valueIn);
    if (value.eq(utils.NEGATIVE_ONE)) {
      return this.emitOp(node, 'PUSHM1');
    } else if (value.eq(utils.ZERO)) {
      // TODO: Empty byte breaks equality with 0. Not sure if it's a bug in the vm or
      //       we need to explicitly push a buffer with one 0 byte rather than PUSH0
      // this.emitOp(node, 'PUSH0');
      return this.emitPush(node, utils.toSignedBuffer(value));
    } else if (value.gt(utils.ZERO) && value.lt(utils.SIXTEEN)) {
      return this.emitOpByte(
        node,
        OPCODE_TO_BYTECODE.PUSH1 - 1 + value.toNumber(),
      );
    }

    return this.emitPush(node, utils.toSignedBuffer(value));
  }

  public emitPushBoolean(node: Node, value: boolean): void {
    this.emitOp(node, value ? 'PUSH1' : 'PUSH0');
  }

  public emitPushString(node: Node, value: string): void {
    return this.emitPush(node, this.toBuffer(value));
  }

  public emitJmp(
    node: Node,
    code: 'JMP' | 'JMPIF' | 'JMPIFNOT',
    pc: ProgramCounter,
  ): void {
    this.emitJump(node, new Jmp(code, pc));
  }

  public emitHelper<T extends Node>(
    node: T,
    options: VisitOptions,
    helper: Helper<T>,
  ): void {
    helper.emit(this, node, options);
  }

  public emitBytecode(bytecode: Bytecode): void {
    const pc = this.pc;
    bytecode.forEach(([node, code]) => {
      if (code instanceof Call) {
        this.emitJump(node, code);
      } else if (code instanceof Jmp) {
        this.emitJump(node, code.plus(pc));
      } else if (code instanceof Jump) {
        throw new Error('Something went wrong.');
      } else {
        this.emitRaw(node, code);
      }
    });
  }

  public emitCall(node: Node): void {
    this.emitJump(node, new Call(this.jumpTablePC));
  }

  public emitSysCall(node: Node, name: SysCallName): void {
    const sysCallBuffer = Buffer.from(name, 'ascii');
    const writer = new BinaryWriter();
    writer.writeVarBytesLE(sysCallBuffer);
    this.emitOp(node, 'SYSCALL', writer.toBuffer());
  }

  public loadModule(sourceFile: SourceFile): void {
    const options = {};

    let moduleIndex = this.moduleMap[sourceFile.getFilePath()];
    if (moduleIndex == null) {
      moduleIndex = this.nextModuleIndex;
      this.nextModuleIndex += 1;
      this.moduleMap[sourceFile.getFilePath()] = moduleIndex;
      this.reverseModuleMap[moduleIndex] = sourceFile.getFilePath();

      const currentScope = this.currentScope;
      this.currentScope = this.createScope(sourceFile, 0, undefined);

      const currentModuleIndex = this.currentModuleIndex;
      this.currentModuleIndex = moduleIndex;

      // [globalObjectVal]
      this.scope.getGlobal(this, sourceFile, this.pushValueOptions(options));
      // [globalObjectVal, globalObjectVal]
      this.emitOp(sourceFile, 'DUP');
      // [globalObjectVal]
      this.emitHelper(
        sourceFile,
        this.pushValueOptions(options),
        this.helpers.addEmptyModule,
      );

      this.currentScope.emit(this, sourceFile, options, (innerOptions) => {
        // []
        this.scope.setGlobal(this, sourceFile, options);
        this.visit(sourceFile, innerOptions);
      });

      this.currentScope = currentScope;
      this.currentModuleIndex = currentModuleIndex;
    }

    // [globalObjectVal]
    this.scope.getGlobal(this, sourceFile, this.pushValueOptions(options));
    // [exports]
    this.emitHelper(
      sourceFile,
      this.pushValueOptions(options),
      this.helpers.getModule({ moduleIndex }),
    );
  }

  public capture(func: () => void): CaptureResult {
    const originalCapturedBytecode = this.capturedBytecode;
    this.capturedBytecode = [];
    const originalPC = this.pc;
    this.pc = 0;
    func();
    const capturedBytecode = this.capturedBytecode;
    this.capturedBytecode = originalCapturedBytecode;
    const capturedLength = this.pc;
    this.pc = originalPC;
    return { length: capturedLength, bytecode: capturedBytecode };
  }

  public toBuffer(value: string): Buffer {
    return Buffer.from(value, 'utf8');
  }

  public plainOptions(options: VisitOptions): VisitOptions {
    return {
      ...options,
      pushValue: false,
      setValue: false,
      catchPC: undefined,
    };
  }

  public pushValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: true };
  }

  public noPushValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: false };
  }

  public setValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, setValue: true };
  }

  public noSetValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, setValue: false };
  }

  public noValueOptions(options: VisitOptions): VisitOptions {
    return { ...options, pushValue: false, setValue: false };
  }

  public breakPCOptions(
    options: VisitOptions,
    pc: ProgramCounter,
  ): VisitOptions {
    return { ...options, breakPC: pc };
  }

  public continuePCOptions(
    options: VisitOptions,
    pc: ProgramCounter,
  ): VisitOptions {
    return { ...options, continuePC: pc };
  }

  public catchPCOptions(
    options: VisitOptions,
    pc: ProgramCounter,
  ): VisitOptions {
    return { ...options, catchPC: pc };
  }

  public castOptions(options: VisitOptions, cast: Type): VisitOptions {
    return { ...options, cast };
  }

  public noCastOptions(options: VisitOptions): VisitOptions {
    return { ...options, cast: undefined };
  }

  public superClassOptions(
    options: VisitOptions,
    superClass: Name,
  ): VisitOptions {
    return { ...options, superClass };
  }

  public noSuperClassOptions(options: VisitOptions): VisitOptions {
    return { ...options, superClass: undefined };
  }

  public reportError(node: Node, message: string, code: DiagnosticCode): void {
    this.context.reportError(node, message, code);
  }

  public reportUnsupported(node: Node): void {
    this.context.reportUnsupported(node);
  }

  public getType(node: Node, required: boolean = false): Type | undefined {
    return this.context.getType(node, required);
  }

  public getSymbol(node: Node, required: boolean = false): Symbol | undefined {
    return this.context.getSymbol(node, required);
  }

  public isOnlyGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean {
    return this.context.isOnlyGlobal(node, type, name);
  }

  public isGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean {
    return this.context.isGlobal(node, type, name);
  }

  public isGlobalSymbol(
    node: Node,
    symbol: Symbol | undefined,
    name: keyof Globals,
  ): boolean {
    return this.context.isGlobalSymbol(node, symbol, name);
  }

  public hasExport(sourceFile: SourceFile, name: string): boolean {
    return (this.exportMap[sourceFile.getFilePath()] || new Set()).has(name);
  }

  public addExport(name: string): void {
    const filePath = this.assertNotNull(
      this.reverseModuleMap[this.currentModuleIndex],
    );
    let fileExports = this.exportMap[filePath];
    if (fileExports == null) {
      fileExports = new Set();
      this.exportMap[filePath] = fileExports;
    }

    fileExports.add(name);
  }

  public assertUnreachable(value: never): never {
    throw new Error('Should not be reached.');
  }

  public assertNotNull<T>(value: T | undefined | null): T {
    return this.context.assertNotNull(value);
  }

  public filterNotNull<T>(value: T | undefined | null): value is T {
    return value != null;
  }

  protected abstract createScope(
    node: Node,
    index: number,
    parent: TScope | undefined,
  ): TScope;

  private emitPush(node: Node, value: Buffer): void {
    if (value.length <= OPCODE_TO_BYTECODE.PUSHBYTES75) {
      this.emitOpByte(node, value.length, value);
    } else if (value.length < 0x100) {
      this.emitOp(
        node,
        'PUSHDATA1',
        new ClientScriptBuilder()
          .emitUInt8(value.length)
          .emit(value)
          .build(),
      );
    } else if (value.length < 0x10000) {
      this.emitOp(
        node,
        'PUSHDATA2',
        new ClientScriptBuilder()
          .emitUInt16LE(value.length)
          .emit(value)
          .build(),
      );
      // TODO: Check this condition if (data.Length < 0x100000000L)
    } else {
      this.emitOp(
        node,
        'PUSHDATA4',
        new ClientScriptBuilder()
          .emitUInt32LE(value.length)
          .emit(value)
          .build(),
      );
    }
  }

  private emitOpByte(
    node: Node,
    byteCodeIn: ByteCode | null,
    buffer?: Buffer | null | undefined,
  ): void {
    const byteCode = `${byteCodeIn == null ? '' : byteCodeIn}`;
    const byteCodeBuffer = BYTECODE_TO_BYTECODE_BUFFER[byteCode];
    if (byteCodeBuffer == null) {
      throw new UnknownOpError(byteCode);
    }
    let value = byteCodeBuffer;
    if (buffer != null) {
      value = Buffer.concat([byteCodeBuffer, buffer]);
    }
    this.emitRaw(node, value);
  }

  private emitRaw(node: Node, value: Buffer): void {
    this.push(node, value);
    this.pc += value.length;
  }

  private emitJump(node: Node, jump: Jump): void {
    this.push(node, jump);
    this.pc += 3;
  }

  private push(node: Node, value: Buffer | Jump): void {
    if (this.capturedBytecode != null) {
      this.capturedBytecode.push([node, value]);
    } else {
      this.bytecode.push([node, value]);
    }
  }
}
