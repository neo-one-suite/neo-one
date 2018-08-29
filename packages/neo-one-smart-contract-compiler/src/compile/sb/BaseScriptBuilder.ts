import {
  BinaryWriter,
  ByteBuffer,
  ByteCode,
  common,
  crypto,
  Op,
  OpCode,
  ScriptBuilder as ClientScriptBuilder,
  SysCallName,
  UInt160,
  UnknownOpError,
  utils,
} from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import { utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import ts from 'typescript';
import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { declarations } from '../declaration';
import { expressions } from '../expression';
import { files } from '../file';
import { Helper, Helpers } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { Call, DeferredProgramCounter, Jmp, Jump, Line, ProgramCounter, ProgramCounterHelper } from '../pc';
import { Name, Scope } from '../scope';
import { statements } from '../statement';
import { Features, LinkedContracts, ScriptBuilderResult, VisitOptions } from '../types';
import { JumpTable } from './JumpTable';
import { resolveJumps } from './resolveJumps';
import { Bytecode, CaptureResult, ScriptBuilder, SingleBytecode, SingleBytecodeValue, Tags } from './ScriptBuilder';

const compilers: ReadonlyArray<ReadonlyArray<new () => NodeCompiler>> = [declarations, expressions, files, statements];

type Compilers = { [K in number]?: NodeCompiler };

export abstract class BaseScriptBuilder<TScope extends Scope> implements ScriptBuilder {
  public readonly jumpTable: JumpTable = new JumpTable();
  private mutableCurrentScope: TScope | undefined;
  private readonly compilers: Compilers;
  private readonly mutableBytecode: SingleBytecode[] = [];
  private mutablePC = 0;
  private readonly jumpTablePC: DeferredProgramCounter = new DeferredProgramCounter();
  // tslint:disable-next-line readonly-array
  private mutableCapturedBytecode: SingleBytecode[] | undefined;
  private mutableProcessedByteCode: ReadonlyArray<SingleBytecode> = [];
  private mutableCurrentTags: Tags = [];
  private readonly nodes: Map<ts.Node, number> = new Map();
  private readonly mutableModuleMap: { [K in string]?: number } = {};
  private readonly mutableReverseModuleMap: { [K in number]?: string } = {};
  private readonly mutableExportMap: { [K in string]?: Set<string> } = {};
  private mutableNextModuleIndex = 0;
  private mutableCurrentModuleIndex = 0;
  private mutableFeatures: Features = { storage: false, dynamicInvoke: false };

  public constructor(
    public readonly context: Context,
    public readonly helpers: Helpers,
    private readonly sourceFile: ts.SourceFile,
    private readonly linked: LinkedContracts = {},
    private readonly allHelpers: ReadonlyArray<Helper> = [],
  ) {
    this.compilers = compilers
      .reduce<ReadonlyArray<new () => NodeCompiler>>((acc, kindCompilers) => acc.concat(kindCompilers), [])
      .reduce<Compilers>((acc, kindCompilerClass) => {
        const kindCompiler = new kindCompilerClass();
        if (acc[kindCompiler.kind] !== undefined) {
          /* istanbul ignore next */
          throw new Error(`Found duplicate compiler for kind ${kindCompiler.kind}`);
        }

        acc[kindCompiler.kind] = kindCompiler;

        return acc;
      }, {});
  }

  public get scope(): TScope {
    if (this.mutableCurrentScope === undefined) {
      /* istanbul ignore next */
      throw new Error('Scope has not been set');
    }

    return this.mutableCurrentScope;
  }

  public get moduleIndex(): number {
    return this.mutableCurrentModuleIndex;
  }

  public process(): void {
    const sourceFile = this.sourceFile;
    const { bytecode } = this.capture(() => {
      const sourceFilePath = tsUtils.file.getFilePath(sourceFile);
      this.mutableModuleMap[sourceFilePath] = this.mutableNextModuleIndex;
      this.mutableReverseModuleMap[this.mutableNextModuleIndex] = sourceFilePath;
      this.mutableCurrentModuleIndex = this.mutableNextModuleIndex;
      this.mutableNextModuleIndex += 1;

      this.mutableCurrentScope = this.createScope(sourceFile, 0, undefined);
      this.nodes.set(sourceFile, 0);
      const options = {};
      this.mutableCurrentScope.emit(this, sourceFile, options, (innerOptions) => {
        // [globalObject]
        this.emitHelper(sourceFile, this.pushValueOptions(innerOptions), this.helpers.createGlobalObject);
        // [globalObject, globalObject]
        this.emitOp(sourceFile, 'DUP');
        // [globalObject]
        this.scope.setGlobal(this, sourceFile, this.pushValueOptions(innerOptions));
        // [globalObject, globalObject]
        this.emitOp(sourceFile, 'DUP');
        // [globalObject]
        this.emitHelper(sourceFile, this.pushValueOptions(innerOptions), this.helpers.addEmptyModule);
        // [globalObject]
        this.allHelpers.forEach((helper) => {
          if (helper.needsGlobal) {
            // [globalObject, globalObject]
            this.emitOp(sourceFile, 'DUP');
          }
          // [globalObject]
          helper.emitGlobal(this, sourceFile, innerOptions);
        });
        // []
        this.emitOp(sourceFile, 'DROP');
        this.visit(sourceFile, innerOptions);
        // [globalObject]
        this.scope.getGlobal(this, sourceFile, options);
        this.allHelpers.forEach((helper) => {
          if (helper.needsGlobalOut) {
            // [globalObject, globalObject]
            this.emitOp(sourceFile, 'DUP');
          }
          // [globalObject]
          helper.emitGlobalOut(this, sourceFile, innerOptions);
        });
        // []
        this.emitOp(sourceFile, 'DROP');
      });
    });

    this.mutableProcessedByteCode = bytecode;
  }

  public getFinalResult(sourceMaps: { readonly [filePath: string]: RawSourceMap }): ScriptBuilderResult {
    this.withProgramCounter((programCounter) => {
      this.emitJmp(this.sourceFile, 'JMP', programCounter.getLast());
      this.jumpTablePC.setPC(programCounter.getCurrent());
      this.jumpTable.emitTable(this, this.sourceFile);
    });
    this.emitBytecode(this.mutableProcessedByteCode);

    const bytecode = resolveJumps(this.mutableBytecode);
    let pc = 0;

    const sourceMapGenerator = new SourceMapGenerator();
    const addedFiles = new Set<string>();

    const mutableTagToLength: { [tag: string]: number } = {};
    // tslint:disable-next-line no-unused
    const buffers = bytecode.map(([node, tags, value], idx) => {
      let finalValue: Buffer;
      if (value instanceof Jump) {
        const offsetPC = new BN(value.pc.getPC()).sub(new BN(pc));
        const jumpPC = offsetPC.toTwos(16);
        if (jumpPC.fromTwos(16).toNumber() !== value.pc.getPC() - pc) {
          /* istanbul ignore next */
          throw new Error(
            `Something went wrong, expected 2's complement of ${value.pc.getPC() - pc}, found: ${jumpPC
              .fromTwos(16)
              .toNumber()}`,
          );
        }
        const byteCodeBuffer = ByteBuffer[Op[value.op]] as Buffer | undefined;
        if (byteCodeBuffer === undefined) {
          /* istanbul ignore next */
          throw new Error('Something went wrong, could not find bytecode buffer');
        }
        finalValue = Buffer.concat([byteCodeBuffer, jumpPC.toArrayLike(Buffer, 'le', 2)]);
      } else if (value instanceof Line) {
        const currentLine = new BN(idx + 1);
        const byteCodeBuffer = ByteBuffer[Op.PUSHBYTES4];
        finalValue = Buffer.concat([byteCodeBuffer, currentLine.toArrayLike(Buffer, 'le', 4)]);
      } else {
        finalValue = value;
      }

      const sourceFile = tsUtils.node.getSourceFile(node);
      const filePath = tsUtils.file.getFilePath(sourceFile);
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      sourceMapGenerator.addMapping({
        generated: { line: idx + 1, column: 0 },
        original: { line: line + 1, column: character },
        source: filePath,
      });
      if (!addedFiles.has(filePath)) {
        addedFiles.add(filePath);
        sourceMapGenerator.setSourceContent(filePath, node.getSourceFile().getFullText());
      }

      const tag = tags[0] as string | undefined;
      if (tag !== undefined) {
        const currentLength = mutableTagToLength[tag] as number | undefined;
        mutableTagToLength[tag] = currentLength === undefined ? finalValue.length : currentLength + finalValue.length;
      }

      pc += finalValue.length;

      return finalValue;
    });

    const sourceMap = (async () => {
      await Promise.all(
        Object.entries(sourceMaps).map(async ([filePath, srcMap]) => {
          await SourceMapConsumer.with(srcMap, undefined, async (consumer) => {
            sourceMapGenerator.applySourceMap(consumer, filePath);
          });
        }),
      );

      return sourceMapGenerator.toJSON();
    })();

    return {
      code: Buffer.concat(buffers),
      sourceMap,
      features: this.mutableFeatures,
    };
  }

  public visit(node: ts.Node, options: VisitOptions): void {
    const compiler = this.compilers[node.kind];
    if (compiler === undefined) {
      this.context.reportUnsupported(node);
    } else {
      compiler.visitNode(this, node, options);
    }
  }

  public withScope(node: ts.Node, options: VisitOptions, func: (options: VisitOptions) => void): void {
    let index = this.nodes.get(node);
    if (index === undefined) {
      index = 0;
    } else {
      index += 1;
    }

    this.nodes.set(node, index);

    const currentScope = this.mutableCurrentScope;
    this.mutableCurrentScope = this.createScope(node, index, currentScope);
    this.mutableCurrentScope.emit(this, node, options, func);
    this.mutableCurrentScope = currentScope;
  }

  public withProgramCounter(func: (pc: ProgramCounterHelper) => void): void {
    const pc = new ProgramCounterHelper(() => this.mutablePC);
    func(pc);
    pc.setLast();
  }

  public emitOp(node: ts.Node, code: OpCode, buffer?: Buffer | undefined): void {
    if ((code === 'APPCALL' || code === 'TAILCALL') && buffer !== undefined && buffer.equals(Buffer.alloc(20, 0))) {
      this.mutableFeatures = { ...this.mutableFeatures, dynamicInvoke: true };
    }

    const bytecode = Op[code] as Op | undefined;
    if (bytecode === undefined) {
      /* istanbul ignore next */
      throw new UnknownOpError(code);
    }
    this.emitOpByte(node, bytecode, buffer);
  }

  public emitPushInt(node: ts.Node, valueIn: number | BN): void {
    const value = new BN(valueIn);
    if (value.eq(utils.NEGATIVE_ONE)) {
      this.emitOp(node, 'PUSHM1');
    } else if (value.eq(utils.ZERO)) {
      this.emitPush(node, utils.toSignedBuffer(value));
    } else if (value.gt(utils.ZERO) && value.lt(utils.SIXTEEN)) {
      this.emitOpByte(node, Op.PUSH1 - 1 + value.toNumber());
    } else {
      this.emitPush(node, utils.toSignedBuffer(value));
    }
  }

  public emitPushBoolean(node: ts.Node, value: boolean): void {
    this.emitOp(node, value ? 'PUSH1' : 'PUSH0');
  }

  public emitPushString(node: ts.Node, value: string): void {
    this.emitPush(node, this.toBuffer(value));
  }

  public emitPushBuffer(node: ts.Node, value: Buffer): void {
    this.emitPush(node, value);
  }

  public emitJmp(node: ts.Node, code: 'JMP' | 'JMPIF' | 'JMPIFNOT', pc: ProgramCounter): void {
    this.emitJump(node, new Jmp(code, pc));
  }

  public emitHelper<T extends ts.Node>(node: T, options: VisitOptions, helper: Helper<T>): void {
    const prevTags = this.mutableCurrentTags;
    this.mutableCurrentTags = [helper.constructor.name];
    helper.emit(this, node, options);
    this.mutableCurrentTags = prevTags;
  }

  public emitBytecode(bytecode: Bytecode): void {
    const pc = this.mutablePC;
    bytecode.forEach(([node, tags, code]) => {
      if (code instanceof Call) {
        this.emitJump(node, code, tags);
      } else if (code instanceof Jmp) {
        this.emitJump(node, code.plus(pc), tags);
      } else if (code instanceof Jump) {
        /* istanbul ignore next */
        throw new Error('Something went wrong.');
      } else if (code instanceof Line) {
        this.emitLineRaw(node, code, tags);
      } else {
        this.emitRaw(node, code, tags);
      }
    });
  }

  public emitCall(node: ts.Node): void {
    this.emitJump(node, new Call(this.jumpTablePC));
  }

  public emitSysCall(node: ts.Node, name: SysCallName): void {
    if (name === 'Neo.Storage.Put' || name === 'Neo.Storage.Delete') {
      this.mutableFeatures = { ...this.mutableFeatures, storage: true };
    }

    const sysCallBuffer = Buffer.from(name, 'ascii');
    const writer = new BinaryWriter();
    writer.writeVarBytesLE(sysCallBuffer);
    this.emitOp(node, 'SYSCALL', writer.toBuffer());
  }

  public emitLine(node: ts.Node): void {
    this.emitLineRaw(node, new Line());
  }

  public loadModule(sourceFile: ts.SourceFile): void {
    const options = {};

    let moduleIndex = this.mutableModuleMap[tsUtils.file.getFilePath(sourceFile)];
    if (moduleIndex === undefined) {
      moduleIndex = this.mutableNextModuleIndex;
      this.mutableNextModuleIndex += 1;
      this.mutableModuleMap[tsUtils.file.getFilePath(sourceFile)] = moduleIndex;
      this.mutableReverseModuleMap[moduleIndex] = tsUtils.file.getFilePath(sourceFile);

      const currentScope = this.mutableCurrentScope;
      this.mutableCurrentScope = this.createScope(sourceFile, 0, undefined);

      const currentModuleIndex = this.mutableCurrentModuleIndex;
      this.mutableCurrentModuleIndex = moduleIndex;

      // [globalObject]
      this.scope.getGlobal(this, sourceFile, this.pushValueOptions(options));
      // [globalObject, globalObject]
      this.emitOp(sourceFile, 'DUP');
      // [globalObject]
      this.emitHelper(sourceFile, this.pushValueOptions(options), this.helpers.addEmptyModule);

      this.mutableCurrentScope.emit(this, sourceFile, options, (innerOptions) => {
        // []
        this.scope.setGlobal(this, sourceFile, options);
        this.visit(sourceFile, innerOptions);
      });

      this.mutableCurrentScope = currentScope;
      this.mutableCurrentModuleIndex = currentModuleIndex;
    }

    // [globalObjectVal]
    this.scope.getGlobal(this, sourceFile, this.pushValueOptions(options));
    // [exports]
    this.emitHelper(sourceFile, this.pushValueOptions(options), this.helpers.getModule({ moduleIndex }));
  }

  public capture(func: () => void): CaptureResult {
    const originalCapturedBytecode = this.mutableCapturedBytecode;
    this.mutableCapturedBytecode = [];
    const originalPC = this.mutablePC;
    this.mutablePC = 0;
    func();
    const capturedBytecode = this.mutableCapturedBytecode;
    this.mutableCapturedBytecode = originalCapturedBytecode;
    const capturedLength = this.mutablePC;
    this.mutablePC = originalPC;

    return { length: capturedLength, bytecode: capturedBytecode };
  }

  public getLinkedScriptHash(node: ts.Node, filePath: string, smartContractClass: string): UInt160 | undefined {
    const reportError = () => {
      this.context.reportError(
        node,
        DiagnosticCode.InvalidLinkedSmartContract,
        DiagnosticMessage.InvalidLinkedSmartContractMissing,
        smartContractClass,
      );
    };
    const fileLinked = this.linked[filePath] as { [smartContractClass: string]: string } | undefined;
    if (fileLinked === undefined) {
      reportError();

      return undefined;
    }

    const address = fileLinked[smartContractClass] as string | undefined;
    if (address === undefined) {
      reportError();

      return undefined;
    }

    return crypto.addressToScriptHash({
      addressVersion: common.NEO_ADDRESS_VERSION,
      address,
    });
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

  public breakPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, breakPC: pc };
  }

  public continuePCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, continuePC: pc };
  }

  public catchPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, catchPC: pc };
  }

  public noCatchPCOptions(options: VisitOptions): VisitOptions {
    return { ...options, catchPC: undefined };
  }

  public finallyPCOptions(options: VisitOptions, pc: ProgramCounter): VisitOptions {
    return { ...options, finallyPC: pc };
  }

  public castOptions(options: VisitOptions, cast?: ts.Type | undefined): VisitOptions {
    return { ...options, cast };
  }

  public noCastOptions(options: VisitOptions): VisitOptions {
    return { ...options, cast: undefined };
  }

  public superClassOptions(options: VisitOptions, superClass: Name): VisitOptions {
    return { ...options, superClass };
  }

  public noSuperClassOptions(options: VisitOptions): VisitOptions {
    return { ...options, superClass: undefined };
  }

  public hasExport(sourceFile: ts.SourceFile, name: string): boolean {
    const exported = this.mutableExportMap[tsUtils.file.getFilePath(sourceFile)];

    return exported !== undefined && exported.has(name);
  }

  public addExport(name: string): void {
    const filePath = commonUtils.nullthrows(this.mutableReverseModuleMap[this.mutableCurrentModuleIndex]);
    let fileExports = this.mutableExportMap[filePath];
    if (fileExports === undefined) {
      this.mutableExportMap[filePath] = fileExports = new Set();
    }

    fileExports.add(name);
  }

  protected abstract createScope(node: ts.Node, index: number, parent: TScope | undefined): TScope;

  private toBuffer(value: string): Buffer {
    return Buffer.from(value, 'utf8');
  }

  private emitPush(node: ts.Node, value: Buffer): void {
    if (value.length <= Op.PUSHBYTES75) {
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
    } else if (value.length < 0x100000000) {
      this.emitOp(
        node,
        'PUSHDATA4',
        new ClientScriptBuilder()
          .emitUInt32LE(value.length)
          .emit(value)
          .build(),
      );
    } else {
      throw new Error('Value too large.');
    }
  }

  private emitOpByte(node: ts.Node, byteCode: ByteCode, buffer?: Buffer | undefined): void {
    const byteCodeBuffer = ByteBuffer[byteCode];
    let value = byteCodeBuffer;
    if (buffer !== undefined) {
      value = Buffer.concat([byteCodeBuffer, buffer]);
    }
    this.emitRaw(node, value);
  }

  private emitRaw(node: ts.Node, value: Buffer, tags: Tags = this.mutableCurrentTags): void {
    this.push(node, tags, value);
    this.mutablePC += value.length;
  }

  private emitJump(node: ts.Node, jump: Jump, tags: Tags = this.mutableCurrentTags): void {
    this.push(node, tags, jump);
    this.mutablePC += 3;
  }

  private emitLineRaw(node: ts.Node, line: Line, tags: Tags = this.mutableCurrentTags): void {
    this.push(node, tags, line);
    this.mutablePC += 5;
  }

  private push(node: ts.Node, tags: Tags, value: SingleBytecodeValue): void {
    if (this.mutableCapturedBytecode !== undefined) {
      this.mutableCapturedBytecode.push([node, tags, value]);
    } else {
      this.mutableBytecode.push([node, tags, value]);
    }
  }
}
