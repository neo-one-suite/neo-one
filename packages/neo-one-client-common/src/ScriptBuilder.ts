import { BaseScriptBuilder } from './BaseScriptBuilder';
import { common, UInt160 } from './common';
import { getSysCallHash, SysCallName } from './models/vm';
import { scriptBuilderParamTo } from './paramUtils';
import { ScriptBuilderParam, ScriptBuilderParamToCallbacks } from './types';

export class ScriptBuilder extends BaseScriptBuilder {
  private readonly pushParamCallbacks: ScriptBuilderParamToCallbacks<this>;

  public constructor() {
    super();

    this.pushParamCallbacks = {
      undefined: () => this.emitPush(Buffer.alloc(0, 0)),
      array: (param) => this.emitPushArray(param),
      map: (param) => this.emitPushMap(param),
      uInt160: (param) => this.emitPushUInt160(common.asUInt160(param)),
      uInt256: (param) => this.emitPushUInt256(common.asUInt256(param)),
      ecPoint: (param) => this.emitPushECPoint(common.asECPoint(param)),
      number: (param) => this.emitPushInt(param),
      bn: (param) => this.emitPushInt(param),
      string: (param) => this.emitPushString(param),
      boolean: (param) => this.emitPushBoolean(param),
      buffer: (param) => this.emitPush(param),
      object: (param) => this.emitPushObject(param),
    };
  }

  public emitPushParam(param: ScriptBuilderParam): this {
    return scriptBuilderParamTo(param, this.pushParamCallbacks);
  }

  // tslint:disable-next-line readonly-array
  public emitPushParams(...params: ScriptBuilderParam[]): this {
    // tslint:disable-next-line no-loop-statement
    for (let i = params.length - 1; i >= 0; i -= 1) {
      this.emitPushParam(params[i]);
    }

    return this;
  }

  // tslint:disable-next-line readonly-array
  public emitSysCall(sysCall: SysCallName, ...params: ScriptBuilderParam[]): this {
    this.emitPushParams(...params);
    const hash = getSysCallHash(sysCall);

    return this.emitSysCallInternal(hash);
  }

  public emitPushArray(params: readonly ScriptBuilderParam[]): this {
    this.emitPushParams(...params);
    this.emitPushParam(params.length);

    return params.length !== 0 ? this.emitOp('PACK') : this.emitOp('NEWARRAY');
  }

  // tslint:disable-next-line readonly-array
  public emitAppCallInvocation(operation: string, ...params: ScriptBuilderParam[]): this {
    this.emitPushArray(params);

    return this.emitPushParam(operation);
  }

  public emitAppCallVerification(scriptHash: UInt160): this {
    this.emitPushParam(common.uInt160ToBuffer(scriptHash));

    return this.emitSysCall('System.Contract.Call');
  }

  // TODO: need to fix how we call contracts later
  // tslint:disable-next-line readonly-array
  public emitAppCall(scriptHash: UInt160, operation: string, ...params: ScriptBuilderParam[]): this {
    this.emitAppCallInvocation(operation, ...params);

    return this.emitAppCallVerification(scriptHash);
  }

  public emitPushMap(params: ReadonlyMap<ScriptBuilderParam, ScriptBuilderParam>): this {
    this.emitOp('NEWMAP');
    params.forEach((value, key) => {
      this.emitOp('DUP');
      this.emitPushParam(key);
      this.emitPushParam(value);
      this.emitOp('SETITEM');
    });

    return this;
  }

  public emitPushObject(params: { readonly [key: string]: ScriptBuilderParam }): this {
    this.emitOp('NEWMAP');
    Object.entries(params).forEach(([key, value]) => {
      this.emitOp('DUP');
      this.emitPushParam(key);
      this.emitPushParam(value);
      this.emitOp('SETITEM');
    });

    return this;
  }

  public emitSysCallName(sysCall: SysCallName): this {
    this.emitPush(getSysCallHash(sysCall));

    return this;
  }
}
