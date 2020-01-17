// tslint:disable no-array-mutation
import { crypto, ScriptBuilder, sha256, UInt160 } from '@neo-one/client-common';
import {
  ContractABI,
  ContractManifest,
  ContractMethodDescriptor,
  ContractParameterDeclaration,
  ContractParameterType,
  ContractPermissionDescriptor,
  ContractPermissions,
  ContractPropertyState,
  StorageItemKey,
  TriggerType,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ExecutionContext, OpInvokeArgs, OpResult } from '../constants';
import { InvalidVerifyNativeContractError, NotImplementedError, UnknownNativeContractMethodError } from '../errors';
import { ContractMethodAttribute } from './ContractMethodAttribute';
import { ContractMethodMetadata, ContractMethodMetadataBase } from './ContractMethodMetadata';

export type NativeContractServiceName = 'Neo.Native.Policy' | 'Neo.Native.Tokens.GAS' | 'Neo.Native.Tokens.NEO';

export interface NativeContractOptions {
  readonly serviceName: NativeContractServiceName;
  readonly methods: readonly ContractMethodData[];
}

export interface ContractMethodData extends ContractMethodMetadataBase, ContractMethodAttribute {}

export const createStorageKey = (hash: UInt160, prefix: Buffer, key: Buffer = Buffer.from([])): StorageItemKey => ({
  hash,
  key: Buffer.concat([prefix, key]),
});

export class NativeContractBase {
  public readonly script: Buffer;
  public readonly hash: UInt160;
  public readonly serviceName: NativeContractServiceName;
  public readonly serviceHash: Buffer;
  public readonly manifest: ContractManifest;
  protected readonly methods: Record<string, ContractMethodMetadata> = {};

  public constructor({ serviceName, methods }: NativeContractOptions) {
    this.serviceName = serviceName;
    this.serviceHash = new BN(sha256(Buffer.from(serviceName, 'ascii')).readUInt32LE(0)).toBuffer('le');
    this.script = new ScriptBuilder().emitSysCall(this.serviceName).build();
    this.hash = crypto.toScriptHash(this.script);

    const descriptors: ContractMethodDescriptor[] = [];
    const safeMethods: string[] = [];
    const methodsIn: Record<string, ContractMethodMetadata> = {};

    methods.forEach((method) => {
      descriptors.push(
        new ContractMethodDescriptor({
          name: method.name,
          parameters: method.parameters,
          returnType: method.returnType,
        }),
      );
      if (method.safeMethod) {
        safeMethods.push(method.name);
      }
      methodsIn[method.name] = new ContractMethodMetadata({
        delegate: method.delegate(this),
        price: method.price,
      });
    });

    this.methods = methodsIn;
    this.manifest = new ContractManifest({
      abi: new ContractABI({
        hash: this.hash,
        // TODO: ContractParameterType.Any
        entryPoint: new ContractMethodDescriptor({
          name: 'main',
          parameters: [
            new ContractParameterDeclaration({ name: 'operation', type: ContractParameterType.String }),
            new ContractParameterDeclaration({ name: 'args', type: ContractParameterType.Array }),
          ],
          returnType: ContractParameterType.Integer,
        }),
        events: [],
        methods: descriptors,
      }),
      permissions: [
        new ContractPermissions({
          contract: new ContractPermissionDescriptor({ hashOrGroup: undefined }),
          methods: [],
        }),
      ],
      groups: [],
      safeMethods,
      trusts: [],
      features: ContractPropertyState.NoProperty,
    });
  }

  public async invoke({ context, args: argsIn }: OpInvokeArgs): Promise<OpResult> {
    // TODO: Sort this out
    // if (context.scriptHash !== this.hash) {
    //   throw new InvalidNativeContractError(context, common.uInt160ToHex(this.hash));
    // }

    const methodName = argsIn[0].asBuffer().toString();
    const method = this.methods[methodName];
    const args = argsIn[1].asArray();
    if (method === undefined) {
      throw new UnknownNativeContractMethodError(context, methodName);
    }

    const result = await method.delegate({ context, args, argsAlt: [] });

    return { context, results: [result] };
  }

  public createStorageKey(prefix: Buffer, key: Buffer = Buffer.from([])): StorageItemKey {
    return {
      hash: this.hash,
      key: Buffer.concat([prefix, key]),
    };
  }

  public getPrice(methodName: string): BN {
    const method = this.methods[methodName];

    return method === undefined ? new BN(0) : method.price;
  }

  public async initialize(context: ExecutionContext): Promise<boolean> {
    throw new NotImplementedError(context, 'initialize');
  }

  public isNep5(): boolean {
    return false;
  }

  protected isPolicy(): boolean {
    return false;
  }

  protected initializeBase(context: ExecutionContext): boolean {
    if (context.init.triggerType !== TriggerType.Application) {
      throw new InvalidVerifyNativeContractError(context, 'initialize');
    }

    return true;
  }
}
