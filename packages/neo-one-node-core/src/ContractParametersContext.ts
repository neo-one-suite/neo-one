import {
  common,
  ContractParameterTypeModel,
  crypto,
  ECPoint,
  ECPointHex,
  InvalidFormatError,
  ScriptBuilder,
  UInt160,
  UInt160Hex,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { Contract } from './Contract';
import { Witness } from './Witness';

export class ContractParametersContext {
  public readonly network: number;
  public readonly scriptHashes: readonly UInt160[];
  private mutableContextItems: { readonly [k in UInt160Hex]: ContextItem | undefined };

  public constructor(scriptHashes: readonly UInt160[], network: number) {
    this.network = network;
    this.scriptHashes = scriptHashes;
    this.mutableContextItems = {};
  }

  public get contextItems() {
    return this.mutableContextItems;
  }

  public get completed() {
    if (Object.keys(this.contextItems).length < this.scriptHashes.length) {
      return false;
    }

    return Object.values(this.contextItems).every(
      (p) => p !== undefined && p.parameters.every((q) => q.value !== undefined),
    );
  }

  // tslint:disable-next-line: no-any
  public addWithIndex(contract: Contract, index: number, parameter: any) {
    const itemInit = this.createItemInternal(contract);
    if (itemInit === undefined) {
      return false;
    }

    const mutableParameters = [...itemInit.parameters];
    const targetParam = mutableParameters[index];
    targetParam.setValue(parameter);
    mutableParameters[index] = targetParam;

    const item = itemInit.clone({ parameters: mutableParameters });
    this.addItemInternal(common.uInt160ToHex(contract.scriptHash), item);

    return true;
  }

  // tslint:disable-next-line: no-any
  public add(contract: Contract, parameters: readonly any[]) {
    const itemInit = this.createItemInternal(contract);
    if (itemInit === undefined) {
      return false;
    }

    const mutableParameters = itemInit.parameters.map((param, idx) => {
      param.setValue(parameters[idx]);

      return param;
    });

    const item = itemInit.clone({ parameters: mutableParameters });
    this.addItemInternal(common.uInt160ToHex(contract.scriptHash), item);

    return true;
  }

  public addSignature(contract: Contract, publicKey: ECPoint, signature: Buffer) {
    const scriptHashHex = common.uInt160ToHex(contract.scriptHash);
    const publicKeyHex = common.ecPointToHex(publicKey);
    const multiResult = crypto.isMultiSigContractWithResult(contract.script);
    if (multiResult.result) {
      const { points } = multiResult;
      if (!points.some((pt) => pt.equals(publicKey))) {
        return false;
      }
      let item = this.createItemInternal(contract);
      if (item === undefined) {
        return false;
      }

      if (item.signatures[publicKeyHex] !== undefined) {
        return false;
      }

      const newSignatures = {
        ...item.signatures,
        [publicKeyHex]: signature,
      };

      item = item.clone({ signatures: newSignatures });
      this.addItemInternal(scriptHashHex, item);

      if (Object.values(newSignatures).length === contract.parameterList.length) {
        const keyDict = _.fromPairs(points.map((p, idx) => [common.ecPointToHex(p), idx]));
        const signatures = Object.entries(newSignatures)
          .map(([key, value]) => ({
            signature: value,
            index: keyDict[key],
          }))
          .sort((a, b) => {
            if (a.index < b.index) {
              return 1;
            }
            if (b.index < a.index) {
              return -1;
            }

            return 0;
          })
          .map((val) => val.signature)
          .filter(utils.notNull);

        signatures.forEach((sig, idx) => {
          if (!this.addWithIndex(contract, idx, sig)) {
            throw new Error('addWithIndex returned true in ContractParametersContext');
          }
        });

        this.addItemInternal(scriptHashHex, item);
      }

      return true;
    }
    {
      let index = -1;
      contract.parameterList.forEach((param, idx) => {
        if (param === ContractParameterTypeModel.Signature) {
          if (index >= 0) {
            throw new Error('not supported');
          }

          index = idx;
        }
      });
      if (index === -1) {
        return false;
      }

      let item = this.createItemInternal(contract);
      if (item === undefined) {
        return false;
      }
      if (item.signatures[publicKeyHex] !== undefined) {
        return false;
      }

      const newParam = item.parameters[index];
      newParam.setValue(signature);
      const newParams = item.parameters
        .slice(0, index)
        .concat(newParam)
        .concat(item.parameters.slice(index + 1));
      item = item.clone({
        signatures: { ...item.signatures, publicKeyHex: signature },
        parameters: newParams,
      });
      this.addItemInternal(scriptHashHex, item);

      return true;
    }
  }

  public getSignatures(scriptHash: UInt160) {
    const hashHex = common.uInt160ToHex(scriptHash);
    const item = this.mutableContextItems[hashHex];

    if (item === undefined) {
      return undefined;
    }

    return item.signatures;
  }

  public getWitnesses(): readonly Witness[] {
    if (!this.completed) {
      throw new Error('ContractParametersContext is completed already.');
    }

    return this.scriptHashes.map((hash) => {
      const item = this.contextItems[common.uInt160ToHex(hash)];
      if (item === undefined) {
        throw new Error('should be defined');
      }
      const builder = new ScriptBuilder();
      // tslint:disable-next-line: no-loop-statement
      for (let j = item?.parameters.length - 1; j >= 0; j -= 1) {
        emitPushContractParameter(builder, item.parameters[j]);
      }

      return new Witness({
        invocation: builder.build(),
        verification: item.script,
      });
    });
  }

  private createItemInternal(contract: Contract) {
    const scriptHashHex = common.uInt160ToHex(contract.scriptHash);
    const maybeItem = this.contextItems[scriptHashHex];
    if (maybeItem) {
      return maybeItem;
    }

    if (!this.scriptHashes.some((hash) => hash.equals(contract.scriptHash))) {
      return undefined;
    }

    return ContextItem.fromContract(contract);
  }

  private addItemInternal(key: UInt160Hex, item: ContextItem) {
    const currentItems = this.contextItems;
    this.mutableContextItems = {
      ...currentItems,
      [key]: item,
    };
  }
}

interface ContextItemAdd {
  readonly script: Buffer;
  readonly parameters: readonly ContractParameter[];
  readonly signatures?: { readonly [k in ECPointHex]: Buffer | undefined };
}

class ContextItem {
  public static fromContract(contract: Contract) {
    return new ContextItem({
      script: contract.script,
      parameters: contract.parameterList.map((p) => new ContractParameter(p)),
    });
  }
  public readonly script: Buffer;
  public readonly parameters: readonly ContractParameter[];
  public readonly signatures: { readonly [k in ECPointHex]: Buffer | undefined };

  public constructor({ script, parameters, signatures }: ContextItemAdd) {
    this.script = script;
    this.parameters = parameters;
    this.signatures = signatures ?? {};
  }

  public clone({ script, parameters, signatures }: Partial<ContextItemAdd>) {
    return new ContextItem({
      script: script ?? this.script,
      signatures: signatures ?? this.signatures,
      parameters: parameters ?? this.parameters,
    });
  }
}

class ContractParameter {
  public readonly type: ContractParameterTypeModel;
  // tslint:disable-next-line: no-any
  public mutableValue: any;

  public constructor(type: ContractParameterTypeModel) {
    this.type = type;
    switch (type) {
      case ContractParameterTypeModel.Signature:
        this.mutableValue = Buffer.alloc(64);
        break;
      case ContractParameterTypeModel.Boolean:
        this.mutableValue = false;
        break;
      case ContractParameterTypeModel.Integer:
        this.mutableValue = 0;
        break;
      case ContractParameterTypeModel.Hash160:
        this.mutableValue = common.ZERO_UINT160;
        break;
      case ContractParameterTypeModel.Hash256:
        this.mutableValue = common.ZERO_UINT256;
        break;
      case ContractParameterTypeModel.ByteArray:
        this.mutableValue = [];
        break;
      case ContractParameterTypeModel.PublicKey:
        this.mutableValue = common.ECPOINT_INFINITY;
        break;
      case ContractParameterTypeModel.String:
        this.mutableValue = '';
        break;
      case ContractParameterTypeModel.Array:
        this.mutableValue = [];
        break;
      case ContractParameterTypeModel.Map:
        this.mutableValue = [];
        break;
      default:
        throw new Error('For TS');
    }
  }

  public get value() {
    return this.mutableValue;
  }

  // tslint:disable-next-line: no-any
  public setValue(value: any) {
    switch (this.type) {
      case ContractParameterTypeModel.Signature:
      case ContractParameterTypeModel.ByteArray:
        if (!Buffer.isBuffer(value)) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.Boolean:
        if (!(typeof value === 'boolean')) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.Integer:
        if (!(typeof value === 'number')) {
          throw new InvalidFormatError();
        }

        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.Hash160:
        if (!common.isUInt160(value)) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.Hash256:
        if (!common.isUInt256(value)) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.PublicKey:
        if (!common.isECPoint(value)) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.String:
        if (!(typeof value === 'string')) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      case ContractParameterTypeModel.Array:
      case ContractParameterTypeModel.Map:
        if (!Array.isArray(value)) {
          throw new InvalidFormatError();
        }
        this.mutableValue = value;
        break;

      default:
        throw new Error('For TS');
    }
  }
}

const emitPushContractParameter = (builder: ScriptBuilder, param: ContractParameter) => {
  switch (param.type) {
    case ContractParameterTypeModel.Signature:
    case ContractParameterTypeModel.ByteArray:
      builder.emitPush(param.value);
      break;

    case ContractParameterTypeModel.Boolean:
      builder.emitPushBoolean(param.value);
      break;

    case ContractParameterTypeModel.Integer:
      builder.emitPushInt(param.value);
      break;

    case ContractParameterTypeModel.Hash160:
      builder.emitPushUInt160(param.value);
      break;

    case ContractParameterTypeModel.Hash256:
      builder.emitPushUInt256(param.value);
      break;

    case ContractParameterTypeModel.PublicKey:
      builder.emitPushECPoint(param.value);
      break;

    case ContractParameterTypeModel.String:
      builder.emitPushString(param.value);
      break;

    case ContractParameterTypeModel.Array:
      const parameters = param.value as readonly ContractParameter[];
      // tslint:disable-next-line: no-loop-statement
      for (let i = parameters.length - 1; i >= 0; i -= 1) {
        emitPushContractParameter(builder, parameters[i]);
      }
      builder.emitPushInt(parameters.length);
      builder.emitOp('PACK');

      break;

    default:
      throw new Error();
  }

  return builder;
};
