// tslint:disable variable-name no-unused
import { common, SysCallName } from '@neo-one/client-core';
import _ from 'lodash';
import { CallExpression, Node, Type, TypeGuards } from 'ts-simple-ast';
import { ScriptBuilder } from './sb';
import { VisitOptions } from './types';

import { DiagnosticCode } from '../DiagnosticCode';
import * as typeUtils from '../typeUtils';
import { deserializeType, SerializableType, serializeType } from './helper';
import { BlockchainInterfaceName } from './helper/blockchain';
import { ForType } from './helper/common';

export interface SysCallType {
  readonly name: string;

  readonly toSignature: () => string;
  readonly handleArgument: (sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type) => void;
  readonly handleResult: (sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type) => void;
}

abstract class SimpleSysCallType implements SysCallType {
  public abstract readonly name: string;

  public abstract isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean;
  public abstract hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean;
  public abstract isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void;
  public abstract handleArgument(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    type?: Type,
    native?: boolean,
  ): void;
  public abstract handleResult(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    type?: Type,
    native?: boolean,
  ): void;

  public toSignature(): string {
    return this.name;
  }
}

class VoidClass extends SimpleSysCallType {
  public readonly name = 'void';

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return false;
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return false;
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    throw new Error('Should not check void at runtime');
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type): void {
    throw new Error('void should not be an argument');
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    sb.emitHelper(node, options, sb.helpers.createUndefined);
  }
}

const VoidValue = new VoidClass();

class UndefinedClass extends SimpleSysCallType {
  public readonly name = 'undefined';

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.isOnlyUndefined(type);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.hasUndefined(type);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.isUndefined);
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'PUSH0');
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.createUndefined);
    }
  }
}

const UndefinedValue = new UndefinedClass();

class NumberClass extends SimpleSysCallType {
  public readonly name = 'number';

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.isOnlyNumber(type);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.hasNumber(type);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.isNumber);
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.getNumber);
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.createNumber);
    }
  }
}

const NumberValue = new NumberClass();

class StringClass extends SimpleSysCallType {
  public readonly name = 'string';

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.isOnlyString(type);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.hasString(type);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.isString);
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.getString);
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.createString);
    }
  }
}

const StringValue = new StringClass();

class BooleanClass extends SimpleSysCallType {
  public readonly name = 'boolean';

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.isOnlyBoolean(type);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return typeUtils.hasBoolean(type);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.isBoolean);
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.getBoolean);
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (!native) {
      sb.emitHelper(node, options, sb.helpers.createBoolean);
    }
  }
}

const BooleanValue = new BooleanClass();

const isObject = (sb: ScriptBuilder, node: Node, options: VisitOptions, whenTrue: () => void) => {
  sb.emitHelper(
    node,
    options,
    sb.helpers.if({
      condition: () => {
        // [val, val]
        sb.emitOp(node, 'DUP');
        // [isObject, val]
        sb.emitHelper(node, options, sb.helpers.isObject);
      },
      whenTrue,
      whenFalse: () => {
        sb.emitOp(node, 'DROP');
        sb.emitPushBoolean(node, false);
      },
    }),
  );
};

class BlockchainInterface extends SimpleSysCallType {
  public readonly name: BlockchainInterfaceName;

  public constructor(name: BlockchainInterfaceName) {
    super();
    this.name = name;
  }

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return sb.isOnlyGlobal(node, type, this.name);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return sb.hasGlobal(node, type, this.name);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    isObject(sb, node, options, () =>
      sb.emitHelper(node, options, sb.helpers.isBlockchainInterface({ name: this.name })),
    );
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (native) {
      throw new Error('BlockchainInterface should not be serialized/deserialized from storage');
    }
    sb.emitHelper(node, options, sb.helpers.unwrapBlockchainInterface);
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (native) {
      throw new Error('BlockchainInterface should not be serialized/deserialized from storage');
    }
    sb.emitHelper(node, options, sb.helpers.wrapBlockchainInterface({ name: this.name }));
  }
}

const AccountValue = new BlockchainInterface('AccountBase');
const AssetValue = new BlockchainInterface('AssetBase');
const AttributeValue = new BlockchainInterface('AttributeBase');
const BlockValue = new BlockchainInterface('BlockBase');
const ContractValue = new BlockchainInterface('ContractBase');
const HeaderValue = new BlockchainInterface('HeaderBase');
const InputValue = new BlockchainInterface('InputBase');
const OutputValue = new BlockchainInterface('OutputBase');
const TransactionValue = new BlockchainInterface('TransactionBase');
const ValidatorValue = new BlockchainInterface('ValidatorBase');
const StorageContextValue = new BlockchainInterface('StorageContextBase');
const StorageContextReadOnlyValue = new BlockchainInterface('StorageContextReadOnlyBase');
const StorageIteratorValue = new BlockchainInterface('StorageIteratorBase');

export const BLOCKCHAIN_INTERFACES = [
  AccountValue,
  AssetValue,
  AttributeValue,
  BlockValue,
  ContractValue,
  HeaderValue,
  InputValue,
  OutputValue,
  TransactionValue,
  ValidatorValue,
  StorageContextValue,
  StorageContextReadOnlyValue,
  StorageIteratorValue,
].map((value) => value.name);

class BufferClass extends SimpleSysCallType {
  public readonly name: 'Buffer' = 'Buffer';

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return sb.isOnlyGlobal(node, type, this.name);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return sb.hasGlobal(node, type, this.name);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    isObject(sb, node, options, () => {
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: this.name }));
      sb.emitHelper(node, options, sb.helpers.instanceof);
    });
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    if (native) {
      serializeType(sb, node, options, SerializableType.Buffer);
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (native) {
      deserializeType(sb, node, options);
    }
    sb.emitHelper(node, options, sb.helpers.wrapBuffer);
  }
}

const BufferValue = new BufferClass();

class ArrayValue extends SimpleSysCallType {
  public readonly name: string;
  private readonly valueType: () => SimpleSysCallType;

  public constructor(valueType: SimpleSysCallType | (() => SimpleSysCallType)) {
    super();
    this.name = `Array<${valueType.name}>`;
    this.valueType = typeof valueType === 'function' ? valueType : () => valueType;
  }

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return (
      typeUtils.isOnlyArray(type) &&
      !typeUtils.isOnlyTuple(type) &&
      type !== undefined &&
      this.valueType().isOnlyType(sb, node, type.getArrayType())
    );
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    if (!typeUtils.hasArray(type) && !typeUtils.isTuple(type)) {
      return false;
    }

    const arrayTypes = typeUtils.getArrayTypes(type);

    return arrayTypes.some(
      (arrayType) => !typeUtils.isTuple(arrayType) && this.valueType().hasType(sb, node, arrayType.getArrayType()),
    );
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    isObject(sb, node, options, () => {
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Array' }));
      sb.emitHelper(node, options, sb.helpers.instanceof);
    });
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrMap({
        map: () => {
          this.valueType().handleArgument(sb, node, options, type === undefined ? type : type.getArrayType(), native);
        },
      }),
    );
    if (native) {
      serializeType(sb, node, options, SerializableType.Array);
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (native) {
      deserializeType(sb, node, options);
    }
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrMap({
        map: () => {
          this.valueType().handleResult(sb, node, options, type === undefined ? type : type.getArrayType(), native);
        },
      }),
    );
    sb.emitHelper(node, options, sb.helpers.wrapArray);
  }
}

class TupleValue extends SimpleSysCallType {
  public readonly name: string;
  private readonly valueType: () => SimpleSysCallType;

  public constructor(valueType: SimpleSysCallType | (() => SimpleSysCallType)) {
    super();
    this.name = 'any';
    this.valueType = typeof valueType === 'function' ? valueType : () => valueType;
  }

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return (
      typeUtils.isOnlyTuple(type) &&
      type !== undefined &&
      type.getTupleElements().every((tupleType) => this.valueType().isOnlyType(sb, node, tupleType))
    );
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    if (!typeUtils.hasTuple(type)) {
      return false;
    }

    const tupleTypes = typeUtils.getTupleTypes(type);

    return tupleTypes.some((tupleType) =>
      tupleType.getTupleElements().every((elementType) => this.valueType().hasType(sb, node, elementType)),
    );
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    isObject(sb, node, options, () => {
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Array' }));
      sb.emitHelper(node, options, sb.helpers.instanceof);
    });
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    throw new Error('Not Implemented');
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    if (type === undefined) {
      sb.reportError(
        node,
        'Syscall return type must be explicitly casted to expected type.',
        DiagnosticCode.UNKNOWN_TYPE,
      );
    } else {
      // [length, ...value]
      sb.emitOp(node, 'UNPACK');
      // [...value]
      sb.emitOp(node, 'DROP');
      // [0, ...value]
      sb.emitPushInt(node, 0);
      // [arr, ...value]
      sb.emitOp(node, 'NEWARRAY');
      type.getTupleElements().forEach((tupleType) => {
        // [arr, arr, ...value]
        sb.emitOp(node, 'DUP');
        // [value, arr, arr, ...value]
        sb.emitOp(node, 'ROT');
        // [val, arr, arr, ...value]
        this.valueType().handleResult(sb, node, options, tupleType, native);
        // [arr, ...value]
        sb.emitOp(node, 'APPEND');
      });
      // [arrayObjectValue]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    }
  }
}

class UnionValue extends SimpleSysCallType {
  public readonly name: string;
  private readonly valueTypes: ReadonlyArray<SimpleSysCallType>;

  public constructor(valueTypes: ReadonlyArray<SimpleSysCallType>) {
    super();
    this.name = valueTypes.map((valueType) => valueType.name).join(' | ');
    this.valueTypes = valueTypes;
  }

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return (
      (typeUtils.isUnion(type) &&
        type !== undefined &&
        type
          .getUnionTypes()
          .every((unionType) => this.valueTypes.some((valueType) => valueType.isOnlyType(sb, node, unionType)))) ||
      (!typeUtils.isUnion(type) &&
        type !== undefined &&
        this.valueTypes.some((valueType) => valueType.isOnlyType(sb, node, type)))
    );
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return (
      (typeUtils.isUnion(type) &&
        type !== undefined &&
        type
          .getUnionTypes()
          .every((unionType) => this.valueTypes.some((valueType) => valueType.hasType(sb, node, unionType)))) ||
      (!typeUtils.isUnion(type) &&
        type !== undefined &&
        this.valueTypes.some((valueType) => valueType.hasType(sb, node, type)))
    );
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    throw new Error('Union should not be checked at runtime');
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    const foundType = this.valueTypes.find((valueType) => valueType.isOnlyType(sb, node, type));
    if (foundType === undefined) {
      if (native) {
        sb.emitHelper(node, options, sb.helpers.genericSerialize);
      } else {
        sb.emitHelper(
          node,
          options,
          sb.helpers.forType({
            type,
            types: this.valueTypes.map<ForType>((valueType) => ({
              hasType: (innerType) => valueType.hasType(sb, node, innerType),
              isRuntimeType: (innerOptions) => valueType.isRuntimeType(sb, node, innerOptions),
              process: (innerOptions) => valueType.handleArgument(sb, node, innerOptions, type, native),
            })),
          }),
        );
      }
    } else {
      foundType.handleArgument(sb, node, options, type, native);
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = false): void {
    const foundType = this.valueTypes.find((valueType) => valueType.isOnlyType(sb, node, type));
    if (foundType === undefined) {
      if (native) {
        sb.emitHelper(node, options, sb.helpers.genericDeserialize);
      } else {
        sb.reportError(
          node,
          'Syscall return type must be explicitly casted to expected type.',
          DiagnosticCode.UNKNOWN_TYPE,
        );
      }
    } else {
      foundType.handleResult(sb, node, options, type, native);
    }
  }
}

const StorageKey = new UnionValue([BufferValue, StringValue]);

const StorageValue = new UnionValue([BufferValue, NumberValue, StringValue, BooleanValue]);

export class TypeAlias {
  public constructor(private readonly name: string, private readonly declaration: string) {}

  public toSignature(): string {
    return this.name;
  }

  public toDeclaration(): string {
    return this.declaration;
  }
}

const SerializableValueArrayAlias = new TypeAlias(
  'SerializableValueArray',
  'interface SerializableValueArray extends Array<SerializableValue> { }',
);
const SerializableValueObjectAlias = new TypeAlias(
  'SerializableValueObject',
  `interface SerializableValueObject {
  [key: string]: SerializableValue;
}`,
);
const SerializableValueAlias = new TypeAlias(
  'SerializableValue',
  'type SerializableValue = undefined | number | string | boolean | Buffer | ' +
    `${SerializableValueArrayAlias.toSignature()} | ${SerializableValueObjectAlias.toSignature()}`,
);

export const TYPE_ALIASES: ReadonlyArray<TypeAlias> = [
  SerializableValueArrayAlias,
  SerializableValueObjectAlias,
  SerializableValueAlias,
];

class Serializable extends SimpleSysCallType {
  public readonly name: string;

  public constructor(
    private readonly shouldSerialize: boolean = false,
    private readonly shouldHandleNull: boolean = false,
  ) {
    super();
    this.name = SerializableValueAlias.toSignature();
  }

  public get type(): SimpleSysCallType {
    // tslint:disable-next-line no-accessor-recursion
    return new UnionValue([BooleanValue, StringValue, NumberValue, BufferValue, new ArrayValue(() => this.type)]);
  }

  public toDeclaration(): string {
    return SerializableValueAlias.toDeclaration();
  }

  public isOnlyType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return this.type.isOnlyType(sb, node, type);
  }

  public hasType(sb: ScriptBuilder, node: Node, type?: Type): boolean {
    return this.type.hasType(sb, node, type);
  }

  public isRuntimeType(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    this.type.isRuntimeType(sb, node, options);
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type, native = true): void {
    this.type.handleArgument(sb, node, options, type, native);

    if (this.shouldSerialize) {
      sb.emitSysCall(node, 'Neo.Runtime.Serialize');
    }
  }

  public handleResult(sb: ScriptBuilder, node: Node, options: VisitOptions, typeIn?: Type, native = true): void {
    let type = typeIn;
    if (
      type !== undefined &&
      this.shouldHandleNull &&
      type.isUnion() &&
      type.getUnionTypes().some((unionType) => typeUtils.isOnlyUndefined(unionType))
    ) {
      type = type.getUnionTypes().find((unionType) => !typeUtils.isOnlyUndefined(unionType));
    }

    const handleValue = () => {
      if (this.shouldSerialize) {
        sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
      }

      this.type.handleResult(sb, node, options, type, native);
    };

    if (this.shouldHandleNull) {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [value, value]
            sb.emitOp(node, 'DUP');
            // [length, value]
            sb.emitOp(node, 'SIZE');
            // [0, length, value]
            sb.emitPushInt(node, 0);
            // [length === 0, value]
            sb.emitOp(node, 'NUMEQUAL');
          },
          whenTrue: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [val]
            sb.emitHelper(node, options, sb.helpers.createUndefined);
          },
          whenFalse: () => {
            handleValue();
          },
        }),
      );
    } else {
      handleValue();
    }
  }

  public addSerialize(): Serializable {
    return new Serializable(true, this.shouldHandleNull);
  }

  public handleNull(): Serializable {
    return new Serializable(this.shouldSerialize, true);
  }
}

const SerializableValue = new Serializable();

export class SysCallArgument {
  private readonly name: string;
  private readonly type: SysCallType;

  public constructor(name: string, type: SysCallType) {
    this.name = name;
    this.type = type;
  }

  public handleArgument(sb: ScriptBuilder, node: Node, options: VisitOptions, type?: Type): void {
    this.type.handleArgument(sb, node, options, type);
  }

  public toSignature(): string {
    return `${this.name}: ${this.type.toSignature()}`;
  }
}

export interface SysCall {
  readonly name: string;
  readonly toDeclaration: () => string;
  readonly handleCall: (sb: ScriptBuilder, node: CallExpression, options: VisitOptions) => void;
}

export interface SimpleSysCallOptions {
  readonly name: SysCallName;
  readonly args?: ReadonlyArray<SysCallArgument>;
  readonly returnType?: SysCallType;
}

export class SimpleSysCall implements SysCall {
  public readonly name: SysCallName;
  private readonly args: ReadonlyArray<SysCallArgument>;
  private readonly returnType: SysCallType;

  public constructor({ name, args = [], returnType = VoidValue }: SimpleSysCallOptions) {
    this.name = name;
    this.args = args;
    this.returnType = returnType;
  }

  public toDeclaration(): string {
    const args = [`name: '${this.name}'`].concat(this.args.map((arg) => arg.toSignature()));

    return `function syscall(${args.join(', ')}): ${this.returnType.toSignature()};`;
  }

  public handleCall(sb: ScriptBuilder, node: CallExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    const args = _.reverse([...node.getArguments().slice(1)]);
    args.forEach((arg, idx) => {
      sb.visit(arg, options);
      this.args[args.length - idx - 1].handleArgument(sb, arg, options, sb.getType(arg));
    });

    sb.emitSysCall(node, this.name);

    if (optionsIn.pushValue) {
      this.returnType.handleResult(sb, node, options, optionsIn.cast);
    } else if (this.returnType !== VoidValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}

export const SYSCALLS = {
  'Neo.Runtime.GetTrigger': new SimpleSysCall({
    name: 'Neo.Runtime.GetTrigger',
    returnType: NumberValue,
  }),
  'Neo.Runtime.CheckWitness': new SimpleSysCall({
    name: 'Neo.Runtime.CheckWitness',
    args: [new SysCallArgument('witness', BufferValue)],
    returnType: BooleanValue,
  }),
  'Neo.Runtime.Notify': (() => {
    const name = 'Neo.Runtime.Notify';
    const valueType = new UnionValue([BufferValue, NumberValue, StringValue, BooleanValue, UndefinedValue]);
    const arrayType = new ArrayValue(valueType);
    const returnType = VoidValue;

    return {
      name,
      toDeclaration(): string {
        const sig = arrayType.toSignature();

        return `function syscall(name: '${name}', ...args: ${sig}): ${returnType.toSignature()};`;
      },
      handleCall(sb: ScriptBuilder, node: CallExpression, optionsIn: VisitOptions): void {
        const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
        const args = _.reverse([...node.getArguments().slice(1)]);
        args.forEach((arg) => {
          sb.visit(arg, options);
          valueType.handleArgument(sb, arg, options, sb.getType(arg));
        });

        // [length, ...]
        sb.emitPushInt(node, args.length);
        // [arr]
        sb.emitOp(node, 'PACK');

        sb.emitSysCall(node, name);
      },
    };
  })(),
  'Neo.Runtime.Log': new SimpleSysCall({
    name: 'Neo.Runtime.Log',
    args: [new SysCallArgument('value', StringValue)],
  }),
  'Neo.Runtime.GetTime': new SimpleSysCall({
    name: 'Neo.Runtime.GetTime',
    returnType: NumberValue,
  }),
  'Neo.Runtime.Serialize': new SimpleSysCall({
    name: 'Neo.Runtime.Serialize',
    args: [new SysCallArgument('value', SerializableValue)],
    returnType: BufferValue,
  }),
  'Neo.Runtime.Deserialize': new SimpleSysCall({
    name: 'Neo.Runtime.Deserialize',
    args: [new SysCallArgument('value', BufferValue)],
    returnType: SerializableValue,
  }),
  'Neo.Blockchain.GetHeight': new SimpleSysCall({
    name: 'Neo.Blockchain.GetHeight',
    returnType: NumberValue,
  }),
  'Neo.Blockchain.GetHeader': new SimpleSysCall({
    name: 'Neo.Blockchain.GetHeader',
    args: [new SysCallArgument('hashOrIndex', new UnionValue([BufferValue, NumberValue]))],
    returnType: HeaderValue,
  }),
  'Neo.Blockchain.GetBlock': new SimpleSysCall({
    name: 'Neo.Blockchain.GetBlock',
    args: [new SysCallArgument('hashOrIndex', new UnionValue([BufferValue, NumberValue]))],
    returnType: BlockValue,
  }),
  'Neo.Blockchain.GetTransaction': new SimpleSysCall({
    name: 'Neo.Blockchain.GetTransaction',
    args: [new SysCallArgument('hash', BufferValue)],
    returnType: TransactionValue,
  }),
  'Neo.Blockchain.GetTransactionHeight': new SimpleSysCall({
    name: 'Neo.Blockchain.GetTransactionHeight',
    args: [new SysCallArgument('hash', BufferValue)],
    returnType: NumberValue,
  }),
  'Neo.Blockchain.GetAccount': new SimpleSysCall({
    name: 'Neo.Blockchain.GetAccount',
    args: [new SysCallArgument('hash', BufferValue)],
    returnType: AccountValue,
  }),
  'Neo.Blockchain.GetValidators': new SimpleSysCall({
    name: 'Neo.Blockchain.GetValidators',
    returnType: new ArrayValue(BufferValue),
  }),
  'Neo.Blockchain.GetAsset': new SimpleSysCall({
    name: 'Neo.Blockchain.GetAsset',
    args: [new SysCallArgument('hash', BufferValue)],
    returnType: AssetValue,
  }),
  'Neo.Blockchain.GetContract': new SimpleSysCall({
    name: 'Neo.Blockchain.GetContract',
    args: [new SysCallArgument('hash', BufferValue)],
    returnType: ContractValue,
  }),
  'Neo.Header.GetHash': new SimpleSysCall({
    name: 'Neo.Header.GetHash',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: BufferValue,
  }),
  'Neo.Header.GetVersion': new SimpleSysCall({
    name: 'Neo.Header.GetVersion',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: NumberValue,
  }),
  'Neo.Header.GetPrevHash': new SimpleSysCall({
    name: 'Neo.Header.GetPrevHash',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: BufferValue,
  }),
  'Neo.Header.GetIndex': new SimpleSysCall({
    name: 'Neo.Header.GetIndex',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: NumberValue,
  }),
  'Neo.Header.GetMerkleRoot': new SimpleSysCall({
    name: 'Neo.Header.GetMerkleRoot',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: BufferValue,
  }),
  'Neo.Header.GetTimestamp': new SimpleSysCall({
    name: 'Neo.Header.GetTimestamp',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: NumberValue,
  }),
  'Neo.Header.GetConsensusData': new SimpleSysCall({
    name: 'Neo.Header.GetConsensusData',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: NumberValue,
  }),
  'Neo.Header.GetNextConsensus': new SimpleSysCall({
    name: 'Neo.Header.GetNextConsensus',
    args: [new SysCallArgument('blockOrHeader', new UnionValue([BlockValue, HeaderValue]))],
    returnType: BufferValue,
  }),
  'Neo.Block.GetTransactionCount': new SimpleSysCall({
    name: 'Neo.Block.GetTransactionCount',
    args: [new SysCallArgument('block', BlockValue)],
    returnType: NumberValue,
  }),
  'Neo.Block.GetTransactions': new SimpleSysCall({
    name: 'Neo.Block.GetTransactions',
    args: [new SysCallArgument('block', BlockValue)],
    returnType: new ArrayValue(TransactionValue),
  }),
  'Neo.Block.GetTransaction': new SimpleSysCall({
    name: 'Neo.Block.GetTransaction',
    args: [new SysCallArgument('block', BlockValue), new SysCallArgument('index', NumberValue)],
    returnType: TransactionValue,
  }),
  'Neo.Transaction.GetHash': new SimpleSysCall({
    name: 'Neo.Transaction.GetHash',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: BufferValue,
  }),
  'Neo.Transaction.GetType': new SimpleSysCall({
    name: 'Neo.Transaction.GetType',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: NumberValue,
  }),
  'Neo.Transaction.GetAttributes': new SimpleSysCall({
    name: 'Neo.Transaction.GetAttributes',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: new ArrayValue(AttributeValue),
  }),
  'Neo.Transaction.GetInputs': new SimpleSysCall({
    name: 'Neo.Transaction.GetInputs',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: new ArrayValue(InputValue),
  }),
  'Neo.Transaction.GetOutputs': new SimpleSysCall({
    name: 'Neo.Transaction.GetOutputs',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: new ArrayValue(OutputValue),
  }),
  'Neo.Transaction.GetReferences': new SimpleSysCall({
    name: 'Neo.Transaction.GetReferences',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: new ArrayValue(OutputValue),
  }),
  'Neo.Transaction.GetUnspentCoins': new SimpleSysCall({
    name: 'Neo.Transaction.GetUnspentCoins',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: new ArrayValue(OutputValue),
  }),
  'Neo.InvocationTransaction.GetScript': new SimpleSysCall({
    name: 'Neo.InvocationTransaction.GetScript',
    args: [new SysCallArgument('transaction', TransactionValue)],
    returnType: BufferValue,
  }),
  'Neo.Attribute.GetUsage': new SimpleSysCall({
    name: 'Neo.Attribute.GetUsage',
    args: [new SysCallArgument('attribute', AttributeValue)],
    returnType: NumberValue,
  }),
  'Neo.Attribute.GetData': new SimpleSysCall({
    name: 'Neo.Attribute.GetData',
    args: [new SysCallArgument('attribute', AttributeValue)],
    returnType: BufferValue,
  }),
  'Neo.Input.GetHash': new SimpleSysCall({
    name: 'Neo.Input.GetHash',
    args: [new SysCallArgument('input', InputValue)],
    returnType: BufferValue,
  }),
  'Neo.Input.GetIndex': new SimpleSysCall({
    name: 'Neo.Input.GetIndex',
    args: [new SysCallArgument('input', InputValue)],
    returnType: NumberValue,
  }),
  'Neo.Output.GetAssetId': new SimpleSysCall({
    name: 'Neo.Output.GetAssetId',
    args: [new SysCallArgument('output', OutputValue)],
    returnType: BufferValue,
  }),
  'Neo.Output.GetValue': new SimpleSysCall({
    name: 'Neo.Output.GetValue',
    args: [new SysCallArgument('output', OutputValue)],
    returnType: NumberValue,
  }),
  'Neo.Output.GetScriptHash': new SimpleSysCall({
    name: 'Neo.Output.GetScriptHash',
    args: [new SysCallArgument('output', OutputValue)],
    returnType: BufferValue,
  }),
  'Neo.Account.GetScriptHash': new SimpleSysCall({
    name: 'Neo.Account.GetScriptHash',
    args: [new SysCallArgument('account', AccountValue)],
    returnType: BufferValue,
  }),
  'Neo.Account.GetVotes': new SimpleSysCall({
    name: 'Neo.Account.GetVotes',
    args: [new SysCallArgument('account', AccountValue)],
    returnType: new ArrayValue(BufferValue),
  }),
  'Neo.Account.GetBalance': new SimpleSysCall({
    name: 'Neo.Account.GetBalance',
    args: [new SysCallArgument('account', AccountValue), new SysCallArgument('assetHash', BufferValue)],
    returnType: NumberValue,
  }),
  'Neo.Asset.GetAssetId': new SimpleSysCall({
    name: 'Neo.Asset.GetAssetId',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: BufferValue,
  }),
  'Neo.Asset.GetAssetType': new SimpleSysCall({
    name: 'Neo.Asset.GetAssetType',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: NumberValue,
  }),
  'Neo.Asset.GetAmount': new SimpleSysCall({
    name: 'Neo.Asset.GetAmount',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: NumberValue,
  }),
  'Neo.Asset.GetAvailable': new SimpleSysCall({
    name: 'Neo.Asset.GetAvailable',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: NumberValue,
  }),
  'Neo.Asset.GetPrecision': new SimpleSysCall({
    name: 'Neo.Asset.GetPrecision',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: NumberValue,
  }),
  'Neo.Asset.GetOwner': new SimpleSysCall({
    name: 'Neo.Asset.GetOwner',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: BufferValue,
  }),
  'Neo.Asset.GetAdmin': new SimpleSysCall({
    name: 'Neo.Asset.GetAdmin',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: BufferValue,
  }),
  'Neo.Asset.GetIssuer': new SimpleSysCall({
    name: 'Neo.Asset.GetIssuer',
    args: [new SysCallArgument('asset', AssetValue)],
    returnType: BufferValue,
  }),
  'Neo.Contract.GetScript': new SimpleSysCall({
    name: 'Neo.Contract.GetScript',
    args: [new SysCallArgument('contract', ContractValue)],
    returnType: BufferValue,
  }),
  'Neo.Storage.GetContext': new SimpleSysCall({
    name: 'Neo.Storage.GetContext',
    returnType: StorageContextValue,
  }),
  'Neo.Storage.GetReadOnlyContext': new SimpleSysCall({
    name: 'Neo.Storage.GetReadOnlyContext',
    returnType: StorageContextReadOnlyValue,
  }),
  'Neo.StorageContext.AsReadOnly': new SimpleSysCall({
    name: 'Neo.StorageContext.AsReadOnly',
    args: [new SysCallArgument('context', StorageContextValue)],
    returnType: StorageContextReadOnlyValue,
  }),
  'Neo.Storage.Get': new SimpleSysCall({
    name: 'Neo.Storage.Get',
    args: [
      new SysCallArgument('context', new UnionValue([StorageContextValue, StorageContextReadOnlyValue])),
      new SysCallArgument('key', StorageKey),
    ],
    returnType: SerializableValue.addSerialize().handleNull(),
  }),
  'Neo.Storage.Find': new SimpleSysCall({
    name: 'Neo.Storage.Find',
    args: [
      new SysCallArgument('context', new UnionValue([StorageContextValue, StorageContextReadOnlyValue])),
      new SysCallArgument('prefix', StorageKey),
    ],
    returnType: StorageIteratorValue,
  }),
  'Neo.Enumerator.Next': new SimpleSysCall({
    name: 'Neo.Enumerator.Next',
    args: [new SysCallArgument('iterator', StorageIteratorValue)],
    returnType: BooleanValue,
  }),
  'Neo.Iterator.Key': new SimpleSysCall({
    name: 'Neo.Iterator.Key',
    args: [new SysCallArgument('iterator', StorageIteratorValue)],
    returnType: StorageKey,
  }),
  'Neo.Enumerator.Value': new SimpleSysCall({
    name: 'Neo.Enumerator.Value',
    args: [new SysCallArgument('iterator', StorageIteratorValue)],
    returnType: StorageValue,
  }),
  'Neo.Account.SetVotes': new SimpleSysCall({
    name: 'Neo.Account.SetVotes',
    args: [new SysCallArgument('account', AccountValue), new SysCallArgument('votes', new ArrayValue(BufferValue))],
  }),
  'Neo.Validator.Register': new SimpleSysCall({
    name: 'Neo.Validator.Register',
    args: [new SysCallArgument('publicKey', BufferValue)],
    returnType: ValidatorValue,
  }),
  'Neo.Asset.Create': new SimpleSysCall({
    name: 'Neo.Asset.Create',
    args: [
      new SysCallArgument('assetType', NumberValue),
      new SysCallArgument('assetName', StringValue),
      new SysCallArgument('amount', NumberValue),
      new SysCallArgument('precision', NumberValue),
      new SysCallArgument('owner', BufferValue),
      new SysCallArgument('admin', BufferValue),
      new SysCallArgument('issuer', BufferValue),
    ],
    returnType: AssetValue,
  }),
  'Neo.Asset.Renew': new SimpleSysCall({
    name: 'Neo.Asset.Renew',
    args: [new SysCallArgument('asset', AssetValue), new SysCallArgument('years', NumberValue)],
    returnType: NumberValue,
  }),
  'Neo.Contract.Create': new SimpleSysCall({
    name: 'Neo.Contract.Create',
    args: [
      new SysCallArgument('script', BufferValue),
      new SysCallArgument('parameterList', BufferValue),
      new SysCallArgument('returnType', NumberValue),
      new SysCallArgument('properties', NumberValue),
      new SysCallArgument('contractName', StringValue),
      new SysCallArgument('codeVersion', StringValue),
      new SysCallArgument('author', StringValue),
      new SysCallArgument('email', StringValue),
      new SysCallArgument('description', StringValue),
    ],
    returnType: ContractValue,
  }),
  'Neo.Contract.Migrate': new SimpleSysCall({
    name: 'Neo.Contract.Migrate',
    args: [
      new SysCallArgument('script', BufferValue),
      new SysCallArgument('parameterList', BufferValue),
      new SysCallArgument('returnType', NumberValue),
      new SysCallArgument('properties', NumberValue),
      new SysCallArgument('contractName', StringValue),
      new SysCallArgument('codeVersion', StringValue),
      new SysCallArgument('author', StringValue),
      new SysCallArgument('email', StringValue),
      new SysCallArgument('description', StringValue),
    ],
    returnType: ContractValue,
  }),
  'Neo.Contract.GetStorageContext': new SimpleSysCall({
    name: 'Neo.Contract.GetStorageContext',
    args: [new SysCallArgument('contract', ContractValue)],
    returnType: StorageContextValue,
  }),
  'Neo.Contract.Destroy': new SimpleSysCall({
    name: 'Neo.Contract.Destroy',
  }),
  'Neo.Storage.Put': new SimpleSysCall({
    name: 'Neo.Storage.Put',
    args: [
      new SysCallArgument('context', StorageContextValue),
      new SysCallArgument('key', StorageKey),
      new SysCallArgument('value', SerializableValue.addSerialize()),
    ],
  }),
  'Neo.Storage.Delete': new SimpleSysCall({
    name: 'Neo.Storage.Delete',
    args: [new SysCallArgument('context', StorageContextValue), new SysCallArgument('key', StorageKey)],
  }),
  'System.ExecutionEngine.GetScriptContainer': new SimpleSysCall({
    name: 'System.ExecutionEngine.GetScriptContainer',
    returnType: TransactionValue,
  }),
  'System.ExecutionEngine.GetExecutingScriptHash': new SimpleSysCall({
    name: 'System.ExecutionEngine.GetExecutingScriptHash',
    returnType: BufferValue,
  }),
  'System.ExecutionEngine.GetCallingScriptHash': new SimpleSysCall({
    name: 'System.ExecutionEngine.GetCallingScriptHash',
    returnType: BufferValue,
  }),
  'System.ExecutionEngine.GetEntryScriptHash': new SimpleSysCall({
    name: 'System.ExecutionEngine.GetEntryScriptHash',
    returnType: BufferValue,
  }),
  'Neo.Runtime.Return': (() => {
    const name = 'Neo.Runtime.Return';
    const valueType = new UnionValue([BufferValue, NumberValue, StringValue, BooleanValue]);
    const returnType = VoidValue;

    return {
      name,
      toDeclaration(): string {
        const sig = valueType.toSignature();

        return `function syscall(name: '${name}', value: ${sig}): ${returnType.toSignature()};`;
      },
      handleCall(sb: ScriptBuilder, node: CallExpression, optionsIn: VisitOptions): void {
        const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
        const arg = node.getArguments()[1];
        sb.visit(arg, options);
        valueType.handleArgument(sb, arg, options, sb.getType(arg));
      },
    };
  })(),
  'Neo.Runtime.GetArgument': (() => {
    const name = 'Neo.Runtime.GetArgument';
    const valueType = NumberValue;
    // tslint:disable-next-line no-unnecessary-type-annotation
    const returnType: UnionValue = new UnionValue([
      BufferValue,
      BooleanValue,
      NumberValue,
      StringValue,
      new ArrayValue(() => returnType),
      new TupleValue(() => returnType),
    ]);

    return {
      name,
      toDeclaration(): string {
        const sig = valueType.toSignature();

        return `function syscall(name: '${name}', idx: ${sig}): any;`;
      },
      handleCall(sb: ScriptBuilder, node: CallExpression, optionsIn: VisitOptions): void {
        const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
        const arg = node.getArguments()[1];
        sb.visit(arg, options);
        sb.emitHelper(arg, options, sb.helpers.getArgument({ type: sb.getType(arg) }));
        if (optionsIn.pushValue) {
          returnType.handleResult(sb, node, optionsIn, optionsIn.cast);
        } else {
          sb.emitOp(node, 'DROP');
        }
      },
    };
  })(),
  'Neo.Runtime.Call': (() => {
    const name = 'Neo.Runtime.Call';
    const valueType = SerializableValue;
    const returnType = valueType;

    return {
      name,
      toDeclaration(): string {
        const sig = valueType.toSignature();

        return `function syscall(name: '${name}', hash: Buffer, ...args: Array<${sig}>): ${returnType.toSignature()};`;
      },
      handleCall(sb: ScriptBuilder, node: CallExpression, optionsIn: VisitOptions): void {
        const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));

        // exprCall  = Buffer.from("1225ACFA1", "hex"),
        const exprCall = node.getArguments()[1];

        if (!TypeGuards.isCallExpression(exprCall)) {
          throw new Error('ARG[1] Expecting callExpression ');
        }

        // exprCallObj = [Buffer.from]
        const exprCallObj = exprCall.getExpression();

        if (!TypeGuards.isPropertyAccessExpression(exprCallObj)) {
          throw new Error('Expected: Property Access expression');
        }

        // exprCallObjName = "Buffer"
        const exprCallObjName = exprCallObj.getExpression();

        // exprCallObjFnx = "from"
        const exprCallObjFnxName = exprCallObj.getName();

        if (
          !(TypeGuards.isIdentifier(exprCallObjName) && exprCallObjName.getText() === 'Buffer') ||
          !(exprCallObjFnxName === 'from')
        ) {
          throw new Error('Expected "Buffer.from" expression');
        }

        const argContractId = exprCall.getArguments()[0];
        if (!TypeGuards.isStringLiteral(argContractId)) {
          throw new Error(`Expected contract identifier with Neo.Runtime.CallContract but got: ${exprCall.getText()}`);
        }

        const contractIDHex = common.stringToUInt160(argContractId.getLiteralValue());
        // tslint:disable-next-line no-array-mutation
        const args = [...node.getArguments().slice(2)].reverse();
        args.forEach((arg) => {
          sb.visit(arg, options);
          valueType.handleArgument(sb, arg, options, sb.getType(arg), false);
        });
        sb.emitOp(node, 'APPCALL', contractIDHex);

        if (optionsIn.pushValue) {
          returnType.handleResult(sb, node, options, optionsIn.cast, false);
        } else {
          sb.emitOp(node, 'DROP');
        }
      },
    };
  })(),
};
