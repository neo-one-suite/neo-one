import {
  ArrCloneHelper,
  ArrConcatHelper,
  ArrEveryFuncHelper,
  ArrFilterFuncHelper,
  ArrFilterHelper,
  ArrFilterHelperOptions,
  ArrForEachFuncHelper,
  ArrForEachHelper,
  ArrForEachHelperOptions,
  ArrLeftHelper,
  ArrMapFuncHelper,
  ArrMapHelper,
  ArrMapHelperOptions,
  ArrRangeHelper,
  ArrRangeHelperOptions,
  ArrReduceFuncHelper,
  ArrReduceHelper,
  ArrReduceHelperOptions,
  ArrSomeFuncHelper,
  ArrSomeHelper,
  ArrSomeHelperOptions,
  ArrToStringHelper,
  ArrToStringHelperOptions,
  ExtendArrHelper,
} from './arr';
import { ArrayBindingHelper, ArrayBindingHelperOptions, ObjectBindingHelper, ObjectBindingHelperOptions } from './bind';
import { CreateClassHelper, CreateClassHelperOptions } from './class';
import {
  ArrSliceHelper,
  ArrSliceHelperOptions,
  CloneArrayHelper,
  ConsoleLogHelper,
  DebugLogHelper,
  DebugLogHelperOptions,
  ExpHelper,
  GenericLogSerializeHelper,
} from './common';
import {
  BreakHelper,
  ContinueHelper,
  HandleCompletionHelper,
  ReturnHelper,
  ThrowCompletionHelper,
  ThrowHelper,
} from './completionRecord';
import { ThrowTypeErrorHelper } from './error';
import {
  ArgumentsHelper,
  BindFunctionThisHelper,
  BindFunctionThisHelperOptions,
  CallHelper,
  CallLikeHelper,
  CloneFunctionHelper,
  CreateCallArrayHelper,
  CreateConstructArrayHelper,
  CreateConstructArrayHelperOptions,
  CreateFunctionArrayHelper,
  CreateFunctionArrayHelperOptions,
  CreateFunctionObjectHelper,
  CreateFunctionObjectHelperOptions,
  FunctionHelper,
  FunctionHelperOptions,
  FunctionLikeHelper,
  GetCallableHelper,
  GetCallableHelperOptions,
  InvokeCallHelper,
  InvokeCallHelperOptions,
  InvokeConstructHelper,
  InvokeConstructHelperOptions,
  NewHelper,
  NewHelperOptions,
  ParametersHelper,
  ParametersHelperOptions,
} from './function';
import {
  CreateGlobalObjectHelper,
  GetArgumentHelper,
  GetGlobalPropertyHelper,
  GetGlobalPropertyHelperOptions,
} from './global';
import { Helper } from './Helper';
import {
  CreateEnumeratorIterableIteratorHelper,
  CreateEnumeratorIterableIteratorHelperOptions,
  CreateIterableIteratorBaseHelper,
  CreateIterableIteratorBaseHelperOptions,
  CreateIteratorIterableIteratorHelper,
  CreateIteratorIterableIteratorHelperOptions,
  IterableIteratorForEachHelper,
  IterableIteratorForEachHelperOptions,
} from './iterableIterator';
import {
  RawEnumeratorForEachFuncHelper,
  RawIteratorForEachBaseHelper,
  RawIteratorForEachBaseHelperOptions,
  RawIteratorForEachFuncBaseHelper,
  RawIteratorForEachFuncBaseHelperOptions,
  RawIteratorForEachFuncHelper,
  RawIteratorForEachHelper,
  RawIteratorForEachHelperOptions,
  RawIteratorForEachKeyHelper,
  RawIteratorForEachKeyHelperOptions,
} from './iterator';
import { CreateIteratorResultHelper } from './iteratorResult';
import { KeyedHelper } from './KeyedHelper';
import { MapDeleteHelper } from './map';
import {
  AddEmptyModuleHelper,
  ExportHelper,
  ExportHelperOptions,
  ExportSingleHelper,
  GetCurrentModuleHelper,
  GetModuleHelper,
  GetModuleHelperOptions,
  GetModulesHelper,
} from './module';
import {
  EqualsEqualsEqualsHelper,
  EqualsEqualsEqualsHelperOptions,
  EqualsEqualsHelper,
  EqualsEqualsHelperOptions,
  LessThanHelper,
  LessThanHelperOptions,
} from './relational';
import {
  Case,
  CaseHelper,
  ForLoopHelper,
  ForLoopHelperOptions,
  IfHelper,
  IfHelperOptions,
  ProcessStatementsHelper,
  ProcessStatementsHelperOptions,
} from './statement';
import {
  AtStructuredStorageHelper,
  CommonStorageHelper,
  CreateIterableIteratorStructuredStorageBaseHelper,
  CreateIterableIteratorStructuredStorageBaseHelperOptions,
  CreateIterableIteratorStructuredStorageHelper,
  CreateIteratorStructuredStorageHelper,
  CreateKeyIterableIteratorStructuredStorageHelper,
  CreateStructuredStorageHelper,
  CreateStructuredStorageHelperOptions,
  CreateValIterableIteratorStructuredStorageHelper,
  DeleteStorageHelper,
  DeleteStructuredStorageHelper,
  ForEachFuncStructuredStorageBaseHelper,
  ForEachFuncStructuredStorageBaseHelperOptions,
  ForEachFuncStructuredStorageHelper,
  ForEachKeyFuncStructuredStorageHelper,
  ForEachKeyStructuredStorageHelper,
  ForEachKeyStructuredStorageHelperOptions,
  ForEachStructuredStorageBaseHelper,
  ForEachStructuredStorageBaseHelperOptions,
  ForEachStructuredStorageHelper,
  ForEachStructuredStorageHelperOptions,
  ForEachValStructuredStorageHelper,
  ForEachValStructuredStorageHelperOptions,
  GetArrayStorageLengthHelper,
  GetCommonStorageHelper,
  GetKeyStructuredStorageHelper,
  GetStorageBaseHelper,
  GetStorageHelper,
  GetStructuredStorageHelper,
  GetStructuredStorageSizeHelper,
  HandlePrefixArrayStructuredStorageHelper,
  HandlePrefixKeyStructuredStorageHelper,
  HandleUndefinedStorageHelper,
  HandleUndefinedStorageHelperOptions,
  HandleValueStructuredStorageHelper,
  HandleValValueStructuredStorageHelper,
  HasStructuredStorageHelper,
  IterStorageHelper,
  KeyStructuredStorageBaseHelperOptions,
  PutArrayStorageLengthHelper,
  PutCommonStorageHelper,
  PutStorageHelper,
  SetArrayStorageHelper,
  SetStructuredStorageHelper,
  StructuredStorageBaseHelperOptions,
  UnwrapKeyStructuredStorageHelper,
} from './storage';
import {
  ArrayLengthHelper,
  BufferLengthHelper,
  ConcatBufferHelper,
  CreateArrayHelper,
  CreateObjectHelper,
  CreatePropertyObjectHelper,
  FindObjectPropertyHelper,
  FindObjectPropertyHelperBase,
  FindObjectPropertyHelperBaseOptions,
  FindObjectPropertyHelperOptions,
  ForBuiltinTypeHelper,
  ForBuiltinTypeHelperOptions,
  ForIterableTypeHelper,
  ForIterableTypeHelperOptions,
  ForTypeHelper,
  ForTypeHelperOptions,
  GetArrayIndexHelper,
  GetInternalObjectHelper,
  GetInternalObjectPropertyHelper,
  GetObjectHelper,
  GetPropertyObjectHelper,
  GetPropertyObjectKeysHelper,
  GetPropertyObjectPropertyHelper,
  GetPropertyObjectValuesHelper,
  GetSymbolObjectHelper,
  GetSymbolObjectPropertyHelper,
  InObjectPropertyHelper,
  InObjectPropertyHelperOptions,
  InPropertyObjectPropertyHelper,
  InstanceofHelper,
  InSymbolObjectPropertyHelper,
  IsArrayHelper,
  IsArrayStorageHelper,
  IsAttributeHelper,
  IsBooleanHelper,
  IsBufferHelper,
  IsErrorHelper,
  IsInputHelper,
  IsIterableHelper,
  IsIterableIteratorHelper,
  IsIteratorResultHelper,
  IsMapHelper,
  IsMapStorageHelper,
  IsNullHelper,
  IsNullOrUndefinedHelper,
  IsNumberHelper,
  IsObjectHelper,
  IsOutputHelper,
  IsSetHelper,
  IsSetStorageHelper,
  IsStringHelper,
  IsSymbolHelper,
  IsTransactionHelper,
  IsUndefinedHelper,
  OmitObjectPropertiesHelper,
  OmitPropertyObjectPropertiesHelper,
  OmitSymbolObjectPropertiesHelper,
  PackObjectHelper,
  PickObjectPropertiesHelper,
  PickPropertyObjectPropertiesHelper,
  PickSymbolObjectPropertiesHelper,
  SetAccessorPropertyObjectPropertyHelper,
  SetAccessorSymbolObjectPropertyHelper,
  SetArrayIndexHelper,
  SetDataPropertyObjectPropertyHelper,
  SetDataSymbolObjectPropertyHelper,
  SetInternalObjectPropertyHelper,
  SetObjectAccessorPropertyHelperBaseOptions,
  SetPropertyObjectPropertyHelper,
  SetSymbolObjectPropertyHelper,
  ShallowCloneObjectHelper,
  ShallowCloneObjHelper,
  ToBooleanHelper,
  ToNumberHelper,
  ToObjectHelper,
  ToPrimitiveHelper,
  ToPrimitiveHelperOptions,
  ToStringHelper,
  ToStringHelperOptions,
  TypedHelperOptions,
  UnwrapArrayHelper,
  UnwrapArrayStorageHelper,
  UnwrapAttributeHelper,
  UnwrapBooleanHelper,
  UnwrapBufferHelper,
  UnwrapErrorHelper,
  UnwrapInputHelper,
  UnwrapIterableIteratorHelper,
  UnwrapIteratorResultHelper,
  UnwrapMapHelper,
  UnwrapMapStorageHelper,
  UnwrapNumberHelper,
  UnwrapObjectHelper,
  UnwrapOutputHelper,
  UnwrapSetHelper,
  UnwrapSetStorageHelper,
  UnwrapStringHelper,
  UnwrapSymbolHelper,
  UnwrapTransactionHelper,
  UnwrapValHelper,
  UnwrapValHelperOptions,
  UnwrapValRecursiveHelper,
  UnwrapValRecursiveHelperOptions,
  WrapArrayHelper,
  WrapArrayStorageHelper,
  WrapArrayValHelper,
  WrapArrayValHelperOptions,
  WrapAttributeHelper,
  WrapBooleanHelper,
  WrapBufferHelper,
  WrapErrorHelper,
  WrapInputHelper,
  WrapIterableIteratorHelper,
  WrapIteratorResultHelper,
  WrapMapHelper,
  WrapMapStorageHelper,
  WrapNullHelper,
  WrapNumberHelper,
  WrapObjectHelper,
  WrapOutputHelper,
  WrapSetHelper,
  WrapSetStorageHelper,
  WrapStringHelper,
  WrapSymbolHelper,
  WrapTransactionHelper,
  WrapUndefinedHelper,
  WrapValHelper,
  WrapValHelperOptions,
  WrapValRecursiveHelper,
  WrapValRecursiveHelperOptions,
} from './types';
import { IsAccountHelper, UnwrapAccountHelper, WrapAccountHelper } from './types/account';
import { IsAssetHelper, UnwrapAssetHelper, WrapAssetHelper } from './types/asset';
import { IsBlockHelper, UnwrapBlockHelper, WrapBlockHelper } from './types/block';
import { IsContractHelper, UnwrapContractHelper, WrapContractHelper } from './types/contract';
import { IsHeaderHelper, UnwrapHeaderHelper, WrapHeaderHelper } from './types/header';

export interface Helpers {
  // account
  readonly isAccount: IsAccountHelper;
  readonly wrapAccount: WrapAccountHelper;
  readonly unwrapAccount: UnwrapAccountHelper;

  // arr
  readonly arrClone: ArrCloneHelper;
  readonly arrConcat: ArrConcatHelper;
  readonly arrEveryFunc: ArrEveryFuncHelper;
  readonly arrFilter: (options: ArrFilterHelperOptions) => ArrFilterHelper;
  readonly arrFilterFunc: ArrFilterFuncHelper;
  readonly arrLeft: ArrLeftHelper;
  readonly arrMap: (options: ArrMapHelperOptions) => ArrMapHelper;
  readonly arrMapFunc: ArrMapFuncHelper;
  readonly arrForEach: (options: ArrForEachHelperOptions) => ArrForEachHelper;
  readonly arrForEachFunc: ArrForEachFuncHelper;
  readonly arrRange: (options: ArrRangeHelperOptions) => ArrRangeHelper;
  readonly arrReduce: (options: ArrReduceHelperOptions) => ArrReduceHelper;
  readonly arrReduceFunc: ArrReduceFuncHelper;
  readonly arrSomeFunc: ArrSomeFuncHelper;
  readonly arrSome: (options: ArrSomeHelperOptions) => ArrSomeHelper;
  readonly arrToString: (options: ArrToStringHelperOptions) => ArrToStringHelper;
  readonly extendArr: ExtendArrHelper;

  // asset
  readonly isAsset: IsAssetHelper;
  readonly wrapAsset: WrapAssetHelper;
  readonly unwrapAsset: UnwrapAssetHelper;

  // bind
  readonly arrayBinding: (options: ArrayBindingHelperOptions) => ArrayBindingHelper;
  readonly objectBinding: (options: ObjectBindingHelperOptions) => ObjectBindingHelper;

  // block
  readonly isBlock: IsBlockHelper;
  readonly wrapBlock: WrapBlockHelper;
  readonly unwrapBlock: UnwrapBlockHelper;

  // class
  readonly createClass: (options: CreateClassHelperOptions) => CreateClassHelper;

  // contract
  readonly isContract: IsContractHelper;
  readonly wrapContract: WrapContractHelper;
  readonly unwrapContract: UnwrapContractHelper;

  // common
  readonly arrSlice: (options?: ArrSliceHelperOptions) => ArrSliceHelper;
  readonly cloneArray: CloneArrayHelper;
  readonly forType: (options: ForTypeHelperOptions) => ForTypeHelper;
  readonly genericLogSerialize: GenericLogSerializeHelper;
  readonly exp: ExpHelper;
  readonly consoleLog: ConsoleLogHelper;
  readonly debugLog: (options: DebugLogHelperOptions) => DebugLogHelper;

  readonly equalsEqualsEquals: (options: EqualsEqualsEqualsHelperOptions) => EqualsEqualsEqualsHelper;
  readonly equalsEquals: (options: EqualsEqualsHelperOptions) => EqualsEqualsHelper;
  readonly lessThan: (options: LessThanHelperOptions) => LessThanHelper;
  readonly processStatements: (options: ProcessStatementsHelperOptions) => ProcessStatementsHelper;

  readonly args: ArgumentsHelper;
  readonly bindFunctionThis: (options: BindFunctionThisHelperOptions) => BindFunctionThisHelper;
  readonly call: CallHelper;
  readonly callLike: CallLikeHelper;
  readonly cloneFunction: CloneFunctionHelper;
  readonly createCallArray: CreateCallArrayHelper;
  readonly createConstructArray: (options: CreateConstructArrayHelperOptions) => CreateConstructArrayHelper;
  readonly createFunctionArray: (options: CreateFunctionArrayHelperOptions) => CreateFunctionArrayHelper;
  readonly createFunctionObject: (options: CreateFunctionObjectHelperOptions) => CreateFunctionObjectHelper;
  readonly function: (options: FunctionHelperOptions) => FunctionHelper;
  readonly functionLike: FunctionLikeHelper;
  readonly getCallable: (options: GetCallableHelperOptions) => GetCallableHelper;
  readonly invokeCall: (options?: InvokeCallHelperOptions) => InvokeCallHelper;
  readonly invokeConstruct: (options?: InvokeConstructHelperOptions) => InvokeConstructHelper;
  readonly new: (options?: NewHelperOptions) => NewHelper;
  readonly parameters: (options: ParametersHelperOptions) => ParametersHelper;

  readonly forLoop: (options: ForLoopHelperOptions) => ForLoopHelper;
  readonly if: (options: IfHelperOptions) => IfHelper;
  readonly case: (cases: ReadonlyArray<Case>, defaultCase: () => void) => CaseHelper;
  readonly handleCompletion: HandleCompletionHelper;
  readonly return: ReturnHelper;
  readonly throw: ThrowHelper;
  readonly break: BreakHelper;
  readonly continue: ContinueHelper;
  readonly throwCompletion: ThrowCompletionHelper;
  readonly throwTypeError: ThrowTypeErrorHelper;
  readonly wrapBoolean: WrapBooleanHelper;
  readonly wrapNull: WrapNullHelper;
  readonly wrapNumber: WrapNumberHelper;
  readonly createObject: CreateObjectHelper;
  readonly wrapString: WrapStringHelper;
  readonly wrapSymbol: WrapSymbolHelper;
  readonly wrapUndefined: WrapUndefinedHelper;
  readonly isBoolean: IsBooleanHelper;
  readonly isNull: IsNullHelper;
  readonly isNumber: IsNumberHelper;
  readonly isObject: IsObjectHelper;
  readonly isString: IsStringHelper;
  readonly isSymbol: IsSymbolHelper;
  readonly isUndefined: IsUndefinedHelper;
  readonly isNullOrUndefined: (options: TypedHelperOptions) => IsNullOrUndefinedHelper;
  readonly unwrapBoolean: UnwrapBooleanHelper;
  readonly unwrapNumber: UnwrapNumberHelper;
  readonly unwrapString: UnwrapStringHelper;
  readonly unwrapSymbol: UnwrapSymbolHelper;
  readonly getObject: GetObjectHelper;
  readonly toBoolean: (options: TypedHelperOptions) => ToBooleanHelper;
  readonly toString: (options: ToStringHelperOptions) => ToStringHelper;
  readonly toNumber: (options: TypedHelperOptions) => ToNumberHelper;
  readonly toObject: (options: TypedHelperOptions) => ToObjectHelper;
  readonly toPrimitive: (options: ToPrimitiveHelperOptions) => ToPrimitiveHelper;
  readonly getSymbolObject: GetSymbolObjectHelper;
  readonly getSymbolObjectProperty: GetSymbolObjectPropertyHelper;
  readonly setSymbolObjectProperty: SetSymbolObjectPropertyHelper;
  readonly setDataSymbolObjectProperty: SetDataSymbolObjectPropertyHelper;
  readonly setAccessorSymbolObjectProperty: (
    options: SetObjectAccessorPropertyHelperBaseOptions,
  ) => SetAccessorSymbolObjectPropertyHelper;
  readonly getPropertyObject: GetPropertyObjectHelper;
  readonly getPropertyObjectKeys: GetPropertyObjectKeysHelper;
  readonly getPropertyObjectValues: GetPropertyObjectValuesHelper;
  readonly getPropertyObjectProperty: GetPropertyObjectPropertyHelper;
  readonly setPropertyObjectProperty: SetPropertyObjectPropertyHelper;
  readonly setDataPropertyObjectProperty: SetDataPropertyObjectPropertyHelper;
  readonly setAccessorPropertyObjectProperty: (
    options: SetObjectAccessorPropertyHelperBaseOptions,
  ) => SetAccessorPropertyObjectPropertyHelper;
  readonly getInternalObject: GetInternalObjectHelper;
  readonly getInternalObjectProperty: GetInternalObjectPropertyHelper;
  readonly setInternalObjectProperty: SetInternalObjectPropertyHelper;
  readonly shallowCloneObject: ShallowCloneObjectHelper;
  readonly shallowCloneObj: ShallowCloneObjHelper;
  readonly packObject: PackObjectHelper;
  readonly pickObjectProperties: PickObjectPropertiesHelper;
  readonly pickPropertyObjectProperties: PickPropertyObjectPropertiesHelper;
  readonly pickSymbolObjectProperties: PickSymbolObjectPropertiesHelper;
  readonly omitObjectProperties: OmitObjectPropertiesHelper;
  readonly omitPropertyObjectProperties: OmitPropertyObjectPropertiesHelper;
  readonly omitSymbolObjectProperties: OmitSymbolObjectPropertiesHelper;
  readonly wrapObject: WrapObjectHelper;
  readonly unwrapObject: UnwrapObjectHelper;
  readonly instanceof: InstanceofHelper;
  readonly inObjectProperty: (options: InObjectPropertyHelperOptions) => InObjectPropertyHelper;
  readonly inPropertyObjectProperty: InPropertyObjectPropertyHelper;
  readonly inSymbolObjectProperty: InSymbolObjectPropertyHelper;
  readonly createPropertyObject: CreatePropertyObjectHelper;
  readonly findObjectProperty: (options: FindObjectPropertyHelperOptions) => FindObjectPropertyHelper;
  readonly findObjectPropertyBase: (options: FindObjectPropertyHelperBaseOptions) => FindObjectPropertyHelperBase;

  // header
  readonly isHeader: IsHeaderHelper;
  readonly wrapHeader: WrapHeaderHelper;
  readonly unwrapHeader: UnwrapHeaderHelper;

  // iterableIterator
  readonly iterableIteratorForEach: (options: IterableIteratorForEachHelperOptions) => IterableIteratorForEachHelper;
  readonly createEnumeratorIterableIterator: (
    options: CreateEnumeratorIterableIteratorHelperOptions,
  ) => CreateEnumeratorIterableIteratorHelper;
  readonly createIterableIteratorBase: (
    options: CreateIterableIteratorBaseHelperOptions,
  ) => CreateIterableIteratorBaseHelper;
  readonly createIteratorIterableIterator: (
    options: CreateIteratorIterableIteratorHelperOptions,
  ) => CreateIteratorIterableIteratorHelper;

  // iterator
  readonly rawIteratorForEach: (options: RawIteratorForEachHelperOptions) => RawIteratorForEachHelper;
  readonly rawIteratorForEachKey: (options: RawIteratorForEachKeyHelperOptions) => RawIteratorForEachKeyHelper;
  readonly rawIteratorForEachBase: (options: RawIteratorForEachBaseHelperOptions) => RawIteratorForEachBaseHelper;
  readonly rawIteratorForEachFunc: RawIteratorForEachFuncHelper;
  readonly rawIteratorForEachFuncBase: (
    options: RawIteratorForEachFuncBaseHelperOptions,
  ) => RawIteratorForEachFuncBaseHelper;
  readonly rawEnumeratorForEachFunc: RawEnumeratorForEachFuncHelper;

  // iteratorResult
  readonly createIteratorResult: CreateIteratorResultHelper;

  // map
  readonly mapDelete: MapDeleteHelper;

  // storage
  readonly putCommonStorage: PutCommonStorageHelper;
  readonly handleUndefinedStorage: (options: HandleUndefinedStorageHelperOptions) => HandleUndefinedStorageHelper;
  readonly commonStorage: CommonStorageHelper;
  readonly deleteStorage: DeleteStorageHelper;
  readonly iterStorage: IterStorageHelper;
  readonly putStorage: PutStorageHelper;
  readonly getStorageBase: GetStorageBaseHelper;
  readonly getStorage: GetStorageHelper;
  readonly getCommonStorage: GetCommonStorageHelper;
  readonly atStructuredStorage: (options: KeyStructuredStorageBaseHelperOptions) => AtStructuredStorageHelper;
  readonly createIteratorStructuredStorage: (
    options: StructuredStorageBaseHelperOptions,
  ) => CreateIteratorStructuredStorageHelper;
  readonly createStructuredStorage: (options: CreateStructuredStorageHelperOptions) => CreateStructuredStorageHelper;
  readonly deleteStructuredStorage: (options: KeyStructuredStorageBaseHelperOptions) => DeleteStructuredStorageHelper;
  readonly getKeyStructuredStorage: (options: KeyStructuredStorageBaseHelperOptions) => GetKeyStructuredStorageHelper;
  readonly getStructuredStorage: (options: KeyStructuredStorageBaseHelperOptions) => GetStructuredStorageHelper;
  readonly hasStructuredStorage: (options: KeyStructuredStorageBaseHelperOptions) => HasStructuredStorageHelper;
  readonly setStructuredStorage: (options: KeyStructuredStorageBaseHelperOptions) => SetStructuredStorageHelper;
  readonly setArrayStorage: SetArrayStorageHelper;
  readonly forEachFuncStructuredStorageBase: (
    options: ForEachFuncStructuredStorageBaseHelperOptions,
  ) => ForEachFuncStructuredStorageBaseHelper;
  readonly forEachKeyFuncStructuredStorage: (
    options: StructuredStorageBaseHelperOptions,
  ) => ForEachKeyFuncStructuredStorageHelper;
  readonly forEachFuncStructuredStorage: (
    options: StructuredStorageBaseHelperOptions,
  ) => ForEachFuncStructuredStorageHelper;
  readonly forEachStructuredStorageBase: (
    options: ForEachStructuredStorageBaseHelperOptions,
  ) => ForEachStructuredStorageBaseHelper;
  readonly forEachKeyStructuredStorage: (
    options: ForEachKeyStructuredStorageHelperOptions,
  ) => ForEachKeyStructuredStorageHelper;
  readonly forEachStructuredStorage: (options: ForEachStructuredStorageHelperOptions) => ForEachStructuredStorageHelper;
  readonly forEachValStructuredStorage: (
    options: ForEachValStructuredStorageHelperOptions,
  ) => ForEachValStructuredStorageHelper;
  readonly getStructuredStorageSize: (options: StructuredStorageBaseHelperOptions) => GetStructuredStorageSizeHelper;
  readonly handleValueStructuredStorage: HandleValueStructuredStorageHelper;
  readonly handleValValueStructuredStorage: HandleValValueStructuredStorageHelper;
  readonly handlePrefixKeyStructuredStorage: HandlePrefixKeyStructuredStorageHelper;
  readonly createIterableIteratorStructuredStorageBase: (
    options: CreateIterableIteratorStructuredStorageBaseHelperOptions,
  ) => CreateIterableIteratorStructuredStorageBaseHelper;
  readonly createIterableIteratorStructuredStorage: (
    options: StructuredStorageBaseHelperOptions,
  ) => CreateIterableIteratorStructuredStorageHelper;
  readonly createKeyIterableIteratorStructuredStorage: (
    options: StructuredStorageBaseHelperOptions,
  ) => CreateKeyIterableIteratorStructuredStorageHelper;
  readonly createValIterableIteratorStructuredStorage: (
    options: StructuredStorageBaseHelperOptions,
  ) => CreateValIterableIteratorStructuredStorageHelper;
  readonly getArrayStorageLength: GetArrayStorageLengthHelper;
  readonly putArrayStorageLength: PutArrayStorageLengthHelper;
  readonly handlePrefixArrayStructuredStorage: HandlePrefixArrayStructuredStorageHelper;
  readonly unwrapKeyStructuredStorage: (options: TypedHelperOptions) => UnwrapKeyStructuredStorageHelper;

  // types
  readonly forBuiltinType: (options: ForBuiltinTypeHelperOptions) => ForBuiltinTypeHelper;
  readonly forIterableType: (options: ForIterableTypeHelperOptions) => ForIterableTypeHelper;
  readonly unwrapVal: (options: UnwrapValHelperOptions) => UnwrapValHelper;
  readonly wrapVal: (options: WrapValHelperOptions) => WrapValHelper;
  readonly wrapArrayVal: (options: WrapArrayValHelperOptions) => WrapArrayValHelper;
  readonly unwrapValRecursive: (options: UnwrapValRecursiveHelperOptions) => UnwrapValRecursiveHelper;
  readonly wrapValRecursive: (options: WrapValRecursiveHelperOptions) => WrapValRecursiveHelper;

  // types/array
  readonly arrayLength: ArrayLengthHelper;
  readonly createArray: CreateArrayHelper;
  readonly getArrayIndex: GetArrayIndexHelper;
  readonly setArrayIndex: SetArrayIndexHelper;
  readonly wrapArray: WrapArrayHelper;
  readonly unwrapArray: UnwrapArrayHelper;
  readonly isArray: IsArrayHelper;

  // types/arrayStorage
  readonly wrapArrayStorage: WrapArrayStorageHelper;
  readonly unwrapArrayStorage: UnwrapArrayStorageHelper;
  readonly isArrayStorage: IsArrayStorageHelper;

  // types/attribute
  readonly wrapAttribute: WrapAttributeHelper;
  readonly unwrapAttribute: UnwrapAttributeHelper;
  readonly isAttribute: IsAttributeHelper;

  // types/buffer
  readonly bufferLength: BufferLengthHelper;
  readonly concatBuffer: ConcatBufferHelper;
  readonly createBuffer: WrapBufferHelper;
  readonly isBuffer: IsBufferHelper;
  readonly unwrapBuffer: UnwrapBufferHelper;
  readonly wrapBuffer: WrapBufferHelper;

  // types/error
  readonly wrapError: WrapErrorHelper;
  readonly unwrapError: UnwrapErrorHelper;
  readonly isError: IsErrorHelper;

  // types/input
  readonly wrapInput: WrapInputHelper;
  readonly unwrapInput: UnwrapInputHelper;
  readonly isInput: IsInputHelper;

  // types/iterable
  readonly isIterable: IsIterableHelper;

  // types/iteratorResult
  readonly wrapIteratorResult: WrapIteratorResultHelper;
  readonly unwrapIteratorResult: UnwrapIteratorResultHelper;
  readonly isIteratorResult: IsIteratorResultHelper;

  // types/iterableIterator
  readonly wrapIterableIterator: WrapIterableIteratorHelper;
  readonly unwrapIterableIterator: UnwrapIterableIteratorHelper;
  readonly isIterableIterator: IsIterableIteratorHelper;

  // types/map
  readonly wrapMap: WrapMapHelper;
  readonly unwrapMap: UnwrapMapHelper;
  readonly isMap: IsMapHelper;

  // types/mapStorage
  readonly wrapMapStorage: WrapMapStorageHelper;
  readonly unwrapMapStorage: UnwrapMapStorageHelper;
  readonly isMapStorage: IsMapStorageHelper;

  // types/output
  readonly wrapOutput: WrapOutputHelper;
  readonly unwrapOutput: UnwrapOutputHelper;
  readonly isOutput: IsOutputHelper;

  // types/set
  readonly wrapSet: WrapSetHelper;
  readonly unwrapSet: UnwrapSetHelper;
  readonly isSet: IsSetHelper;

  // types/setStorage
  readonly wrapSetStorage: WrapSetStorageHelper;
  readonly unwrapSetStorage: UnwrapSetStorageHelper;
  readonly isSetStorage: IsSetStorageHelper;

  // types/transaction
  readonly wrapTransaction: WrapTransactionHelper;
  readonly unwrapTransaction: UnwrapTransactionHelper;
  readonly isTransaction: IsTransactionHelper;

  readonly export: (options: ExportHelperOptions) => ExportHelper;
  readonly exportSingle: (options: ExportHelperOptions) => ExportSingleHelper;
  readonly getModule: (options: GetModuleHelperOptions) => GetModuleHelper;
  readonly getCurrentModule: GetCurrentModuleHelper;
  readonly getModules: GetModulesHelper;
  readonly addEmptyModule: AddEmptyModuleHelper;

  readonly createGlobalObject: CreateGlobalObjectHelper;
  readonly getArgument: (options: TypedHelperOptions) => GetArgumentHelper;
  readonly getGlobalProperty: (options: GetGlobalPropertyHelperOptions) => GetGlobalPropertyHelper;
}

export const createHelpers = (): Helpers => {
  const mutableCache: { [K in string]?: Helper } = {};

  function memoized<Options, T extends Helper>(
    helperClass: (new (options: Options) => T) & KeyedHelper<Options>,
  ): (options: Options) => T {
    return (options: Options) => {
      const key = helperClass.getKey(options);
      let value = mutableCache[key];
      if (value === undefined) {
        mutableCache[key] = value = new helperClass(options);
      }

      return value as T;
    };
  }

  return {
    // account
    isAccount: new IsAccountHelper(),
    wrapAccount: new WrapAccountHelper(),
    unwrapAccount: new UnwrapAccountHelper(),

    // arr
    arrClone: new ArrCloneHelper(),
    arrConcat: new ArrConcatHelper(),
    arrEveryFunc: new ArrEveryFuncHelper(),
    arrFilter: (options) => new ArrFilterHelper(options),
    arrFilterFunc: new ArrFilterFuncHelper(),
    arrLeft: new ArrLeftHelper(),
    arrMap: (options) => new ArrMapHelper(options),
    arrMapFunc: new ArrMapFuncHelper(),
    arrForEach: (options) => new ArrForEachHelper(options),
    arrForEachFunc: new ArrForEachFuncHelper(),
    arrRange: (options) => new ArrRangeHelper(options),
    arrReduce: (options) => new ArrReduceHelper(options),
    arrReduceFunc: new ArrReduceFuncHelper(),
    arrSomeFunc: new ArrSomeFuncHelper(),
    arrSome: (options) => new ArrSomeHelper(options),
    arrToString: (options) => new ArrToStringHelper(options),
    extendArr: new ExtendArrHelper(),

    // asset
    isAsset: new IsAssetHelper(),
    wrapAsset: new WrapAssetHelper(),
    unwrapAsset: new UnwrapAssetHelper(),

    // bind
    arrayBinding: (options) => new ArrayBindingHelper(options),
    objectBinding: (options) => new ObjectBindingHelper(options),

    // block
    isBlock: new IsBlockHelper(),
    wrapBlock: new WrapBlockHelper(),
    unwrapBlock: new UnwrapBlockHelper(),

    // class
    createClass: (options) => new CreateClassHelper(options),

    // contract
    isContract: new IsContractHelper(),
    wrapContract: new WrapContractHelper(),
    unwrapContract: new UnwrapContractHelper(),

    // common
    arrSlice: (options = {}) => new ArrSliceHelper(options),
    cloneArray: new CloneArrayHelper(),
    forType: (options) => new ForTypeHelper(options),
    genericLogSerialize: new GenericLogSerializeHelper(),
    exp: new ExpHelper(),
    consoleLog: new ConsoleLogHelper(),
    debugLog: (options) => new DebugLogHelper(options),

    equalsEqualsEquals: (options) => new EqualsEqualsEqualsHelper(options),
    equalsEquals: (options) => new EqualsEqualsHelper(options),
    lessThan: (options) => new LessThanHelper(options),
    processStatements: (options) => new ProcessStatementsHelper(options),

    args: new ArgumentsHelper(),
    bindFunctionThis: (options) => new BindFunctionThisHelper(options),
    call: new CallHelper(),
    callLike: new CallLikeHelper(),
    cloneFunction: new CloneFunctionHelper(),
    createCallArray: new CreateCallArrayHelper(),
    createConstructArray: (options) => new CreateConstructArrayHelper(options),
    createFunctionArray: (options) => new CreateFunctionArrayHelper(options),
    createFunctionObject: (options) => new CreateFunctionObjectHelper(options),
    function: (options) => new FunctionHelper(options),
    functionLike: new FunctionLikeHelper(),
    getCallable: memoized(GetCallableHelper),
    invokeCall: memoized(InvokeCallHelper),
    invokeConstruct: (options?) => new InvokeConstructHelper(options),
    new: (options?) => new NewHelper(options),
    parameters: (options) => new ParametersHelper(options),

    forLoop: (options) => new ForLoopHelper(options),
    if: (options) => new IfHelper(options),
    case: (cases, defaultCase) => new CaseHelper(cases, defaultCase),
    handleCompletion: new HandleCompletionHelper(),
    return: new ReturnHelper(),
    throw: new ThrowHelper(),
    break: new BreakHelper(),
    continue: new ContinueHelper(),
    throwCompletion: new ThrowCompletionHelper(),
    throwTypeError: new ThrowTypeErrorHelper(),
    wrapBoolean: new WrapBooleanHelper(),
    wrapNull: new WrapNullHelper(),
    wrapNumber: new WrapNumberHelper(),
    createObject: new CreateObjectHelper(),
    wrapString: new WrapStringHelper(),
    wrapSymbol: new WrapSymbolHelper(),
    wrapUndefined: new WrapUndefinedHelper(),
    isBoolean: new IsBooleanHelper(),
    isNull: new IsNullHelper(),
    isNumber: new IsNumberHelper(),
    isObject: new IsObjectHelper(),
    isString: new IsStringHelper(),
    isSymbol: new IsSymbolHelper(),
    isUndefined: new IsUndefinedHelper(),
    isNullOrUndefined: (options) => new IsNullOrUndefinedHelper(options),
    unwrapBoolean: new UnwrapBooleanHelper(),
    unwrapNumber: new UnwrapNumberHelper(),
    unwrapString: new UnwrapStringHelper(),
    unwrapSymbol: new UnwrapSymbolHelper(),
    getObject: new GetObjectHelper(),
    toBoolean: (options) => new ToBooleanHelper(options),
    toString: (options) => new ToStringHelper(options),
    toNumber: (options) => new ToNumberHelper(options),
    toObject: (options) => new ToObjectHelper(options),
    toPrimitive: (options) => new ToPrimitiveHelper(options),
    getSymbolObject: new GetSymbolObjectHelper(),
    getSymbolObjectProperty: new GetSymbolObjectPropertyHelper(),
    setSymbolObjectProperty: new SetSymbolObjectPropertyHelper(),
    setDataSymbolObjectProperty: new SetDataSymbolObjectPropertyHelper(),
    setAccessorSymbolObjectProperty: (options) => new SetAccessorSymbolObjectPropertyHelper(options),
    getPropertyObject: new GetPropertyObjectHelper(),
    getPropertyObjectKeys: new GetPropertyObjectKeysHelper(),
    getPropertyObjectValues: new GetPropertyObjectValuesHelper(),
    getPropertyObjectProperty: new GetPropertyObjectPropertyHelper(),
    setPropertyObjectProperty: new SetPropertyObjectPropertyHelper(),
    setDataPropertyObjectProperty: new SetDataPropertyObjectPropertyHelper(),
    setAccessorPropertyObjectProperty: (options) => new SetAccessorPropertyObjectPropertyHelper(options),
    getInternalObject: new GetInternalObjectHelper(),
    getInternalObjectProperty: new GetInternalObjectPropertyHelper(),
    setInternalObjectProperty: new SetInternalObjectPropertyHelper(),
    shallowCloneObject: new ShallowCloneObjectHelper(),
    shallowCloneObj: new ShallowCloneObjHelper(),
    packObject: new PackObjectHelper(),
    pickObjectProperties: new PickObjectPropertiesHelper(),
    pickPropertyObjectProperties: new PickPropertyObjectPropertiesHelper(),
    pickSymbolObjectProperties: new PickSymbolObjectPropertiesHelper(),
    omitObjectProperties: new OmitObjectPropertiesHelper(),
    omitPropertyObjectProperties: new OmitPropertyObjectPropertiesHelper(),
    omitSymbolObjectProperties: new OmitSymbolObjectPropertiesHelper(),
    wrapObject: new WrapObjectHelper(),
    unwrapObject: new UnwrapObjectHelper(),
    instanceof: new InstanceofHelper(),
    inObjectProperty: (options) => new InObjectPropertyHelper(options),
    inPropertyObjectProperty: new InPropertyObjectPropertyHelper(),
    inSymbolObjectProperty: new InSymbolObjectPropertyHelper(),
    createPropertyObject: new CreatePropertyObjectHelper(),
    findObjectProperty: (options) => new FindObjectPropertyHelper(options),
    findObjectPropertyBase: (options) => new FindObjectPropertyHelperBase(options),

    // header
    isHeader: new IsHeaderHelper(),
    wrapHeader: new WrapHeaderHelper(),
    unwrapHeader: new UnwrapHeaderHelper(),

    // iterableIterator
    iterableIteratorForEach: (options) => new IterableIteratorForEachHelper(options),
    createEnumeratorIterableIterator: (options) => new CreateEnumeratorIterableIteratorHelper(options),
    createIterableIteratorBase: (options) => new CreateIterableIteratorBaseHelper(options),
    createIteratorIterableIterator: (options) => new CreateIteratorIterableIteratorHelper(options),

    // iterator
    rawIteratorForEach: (options) => new RawIteratorForEachHelper(options),
    rawIteratorForEachKey: (options) => new RawIteratorForEachKeyHelper(options),
    rawIteratorForEachBase: (options) => new RawIteratorForEachBaseHelper(options),
    rawIteratorForEachFunc: new RawIteratorForEachFuncHelper(),
    rawIteratorForEachFuncBase: (options) => new RawIteratorForEachFuncBaseHelper(options),
    rawEnumeratorForEachFunc: new RawEnumeratorForEachFuncHelper(),

    // iteratorResult
    createIteratorResult: new CreateIteratorResultHelper(),

    // map
    mapDelete: new MapDeleteHelper(),

    // storage
    putCommonStorage: new PutCommonStorageHelper(),
    handleUndefinedStorage: (options) => new HandleUndefinedStorageHelper(options),
    commonStorage: new CommonStorageHelper(),
    deleteStorage: new DeleteStorageHelper(),
    iterStorage: new IterStorageHelper(),
    putStorage: new PutStorageHelper(),
    getStorageBase: new GetStorageBaseHelper(),
    getStorage: new GetStorageHelper(),
    getCommonStorage: new GetCommonStorageHelper(),
    atStructuredStorage: (options) => new AtStructuredStorageHelper(options),
    createIteratorStructuredStorage: (options) => new CreateIteratorStructuredStorageHelper(options),
    createStructuredStorage: (options) => new CreateStructuredStorageHelper(options),
    deleteStructuredStorage: (options) => new DeleteStructuredStorageHelper(options),
    getKeyStructuredStorage: (options) => new GetKeyStructuredStorageHelper(options),
    getStructuredStorage: (options) => new GetStructuredStorageHelper(options),
    hasStructuredStorage: (options) => new HasStructuredStorageHelper(options),
    setStructuredStorage: (options) => new SetStructuredStorageHelper(options),
    setArrayStorage: new SetArrayStorageHelper(),
    forEachFuncStructuredStorageBase: (options) => new ForEachFuncStructuredStorageBaseHelper(options),
    forEachFuncStructuredStorage: (options) => new ForEachFuncStructuredStorageHelper(options),
    forEachKeyFuncStructuredStorage: (options) => new ForEachKeyFuncStructuredStorageHelper(options),
    forEachStructuredStorageBase: (options) => new ForEachStructuredStorageBaseHelper(options),
    forEachKeyStructuredStorage: (options) => new ForEachKeyStructuredStorageHelper(options),
    forEachStructuredStorage: (options) => new ForEachStructuredStorageHelper(options),
    forEachValStructuredStorage: (options) => new ForEachValStructuredStorageHelper(options),
    getStructuredStorageSize: (options) => new GetStructuredStorageSizeHelper(options),
    handleValueStructuredStorage: new HandleValueStructuredStorageHelper(),
    handleValValueStructuredStorage: new HandleValValueStructuredStorageHelper(),
    handlePrefixKeyStructuredStorage: new HandlePrefixKeyStructuredStorageHelper(),
    createIterableIteratorStructuredStorageBase: (options) =>
      new CreateIterableIteratorStructuredStorageBaseHelper(options),
    createIterableIteratorStructuredStorage: (options) => new CreateIterableIteratorStructuredStorageHelper(options),
    createKeyIterableIteratorStructuredStorage: (options) =>
      new CreateKeyIterableIteratorStructuredStorageHelper(options),
    createValIterableIteratorStructuredStorage: (options) =>
      new CreateValIterableIteratorStructuredStorageHelper(options),
    getArrayStorageLength: new GetArrayStorageLengthHelper(),
    putArrayStorageLength: new PutArrayStorageLengthHelper(),
    handlePrefixArrayStructuredStorage: new HandlePrefixArrayStructuredStorageHelper(),
    unwrapKeyStructuredStorage: (options) => new UnwrapKeyStructuredStorageHelper(options),

    // types
    forBuiltinType: (options) => new ForBuiltinTypeHelper(options),
    forIterableType: (options) => new ForIterableTypeHelper(options),
    unwrapVal: (options) => new UnwrapValHelper(options),
    wrapVal: (options) => new WrapValHelper(options),
    wrapArrayVal: (options) => new WrapArrayValHelper(options),
    unwrapValRecursive: (options) => new UnwrapValRecursiveHelper(options),
    wrapValRecursive: (options) => new WrapValRecursiveHelper(options),

    // types/array
    arrayLength: new ArrayLengthHelper(),
    createArray: new CreateArrayHelper(),
    getArrayIndex: new GetArrayIndexHelper(),
    setArrayIndex: new SetArrayIndexHelper(),
    wrapArray: new WrapArrayHelper(),
    unwrapArray: new UnwrapArrayHelper(),
    isArray: new IsArrayHelper(),

    // types/arrayStorage
    wrapArrayStorage: new WrapArrayStorageHelper(),
    unwrapArrayStorage: new UnwrapArrayStorageHelper(),
    isArrayStorage: new IsArrayStorageHelper(),

    // types/attribute
    wrapAttribute: new WrapAttributeHelper(),
    unwrapAttribute: new UnwrapAttributeHelper(),
    isAttribute: new IsAttributeHelper(),

    // types/buffer
    bufferLength: new BufferLengthHelper(),
    concatBuffer: new ConcatBufferHelper(),
    createBuffer: new WrapBufferHelper(),
    isBuffer: new IsBufferHelper(),
    unwrapBuffer: new UnwrapBufferHelper(),
    wrapBuffer: new WrapBufferHelper(),

    // types/error
    wrapError: new WrapErrorHelper(),
    unwrapError: new UnwrapErrorHelper(),
    isError: new IsErrorHelper(),

    // types/input
    wrapInput: new WrapInputHelper(),
    unwrapInput: new UnwrapInputHelper(),
    isInput: new IsInputHelper(),

    // types/iterable
    isIterable: new IsIterableHelper(),

    // types/iteratorResult
    wrapIteratorResult: new WrapIteratorResultHelper(),
    unwrapIteratorResult: new UnwrapIteratorResultHelper(),
    isIteratorResult: new IsIteratorResultHelper(),

    // types/error
    wrapIterableIterator: new WrapIterableIteratorHelper(),
    unwrapIterableIterator: new UnwrapIterableIteratorHelper(),
    isIterableIterator: new IsIterableIteratorHelper(),

    // types/map
    wrapMap: new WrapMapHelper(),
    unwrapMap: new UnwrapMapHelper(),
    isMap: new IsMapHelper(),

    // types/mapStorage
    wrapMapStorage: new WrapMapStorageHelper(),
    unwrapMapStorage: new UnwrapMapStorageHelper(),
    isMapStorage: new IsMapStorageHelper(),

    // types/output
    wrapOutput: new WrapOutputHelper(),
    unwrapOutput: new UnwrapOutputHelper(),
    isOutput: new IsOutputHelper(),

    // types/set
    wrapSet: new WrapSetHelper(),
    unwrapSet: new UnwrapSetHelper(),
    isSet: new IsSetHelper(),

    // types/setStorage
    wrapSetStorage: new WrapSetStorageHelper(),
    unwrapSetStorage: new UnwrapSetStorageHelper(),
    isSetStorage: new IsSetStorageHelper(),

    // types/transaction
    wrapTransaction: new WrapTransactionHelper(),
    unwrapTransaction: new UnwrapTransactionHelper(),
    isTransaction: new IsTransactionHelper(),

    export: (options) => new ExportHelper(options),
    exportSingle: (options) => new ExportSingleHelper(options),
    getModule: (options) => new GetModuleHelper(options),
    getCurrentModule: new GetCurrentModuleHelper(),
    getModules: new GetModulesHelper(),
    addEmptyModule: new AddEmptyModuleHelper(),

    createGlobalObject: new CreateGlobalObjectHelper(),
    getArgument: (options) => new GetArgumentHelper(options),
    getGlobalProperty: (options) => new GetGlobalPropertyHelper(options),
  };
};
