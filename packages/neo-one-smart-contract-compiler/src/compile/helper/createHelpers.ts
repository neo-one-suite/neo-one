import {
  ArrFilterFuncHelper,
  ArrFilterHelper,
  ArrFilterHelperOptions,
  ArrForEachFuncHelper,
  ArrForEachHelper,
  ArrForEachHelperOptions,
  ArrMapFuncHelper,
  ArrMapHelper,
  ArrMapHelperOptions,
  ArrRangeHelper,
  ArrRangeHelperOptions,
  ArrReduceFuncHelper,
  ArrReduceHelper,
  ArrReduceHelperOptions,
  ExtendArrHelper,
} from './arr';
import { CreateArrayIterableIteratorHelper, GetArrayIterableIteratorClassHelper } from './arrayIterableIterator';
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
  ForTypeHelper,
  ForTypeHelperOptions,
  GenericDeserializeHelper,
  GenericSerializeHelper,
  TypedHelperOptions,
} from './common';
import {
  BreakHelper,
  ContinueHelper,
  HandleCompletionHelper,
  ReturnHelper,
  ThrowCompletionHelper,
  ThrowHelper,
} from './completionRecord';
import { GetErrorClassHelper, ThrowTypeErrorHelper } from './error';
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
import { KeyedHelper } from './KeyedHelper';
import { GetMapClassHelper } from './map';
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
import { GetMapStorageClassHelper, GetSetStorageClassHelper } from './storage';
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
  GetArrayIndexHelper,
  GetInternalObjectHelper,
  GetInternalObjectPropertyHelper,
  GetObjectHelper,
  GetPropertyObjectHelper,
  GetPropertyObjectKeysHelper,
  GetPropertyObjectPropertyHelper,
  GetSymbolObjectHelper,
  GetSymbolObjectPropertyHelper,
  InObjectPropertyHelper,
  InObjectPropertyHelperOptions,
  InPropertyObjectPropertyHelper,
  InstanceofHelper,
  InSymbolObjectPropertyHelper,
  IsArrayHelper,
  IsAttributeHelper,
  IsBooleanHelper,
  IsBufferHelper,
  IsInputHelper,
  IsNullHelper,
  IsNullOrUndefinedHelper,
  IsNumberHelper,
  IsObjectHelper,
  IsOutputHelper,
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
  UnwrapArrayHelper,
  UnwrapAttributeHelper,
  UnwrapBooleanHelper,
  UnwrapBufferHelper,
  UnwrapInputHelper,
  UnwrapNumberHelper,
  UnwrapObjectHelper,
  UnwrapOutputHelper,
  UnwrapStringHelper,
  UnwrapSymbolHelper,
  UnwrapTransactionHelper,
  UnwrapValHelper,
  UnwrapValHelperOptions,
  UnwrapValRecursiveHelper,
  UnwrapValRecursiveHelperOptions,
  WrapArrayHelper,
  WrapArrayValHelper,
  WrapArrayValHelperOptions,
  WrapAttributeHelper,
  WrapBooleanHelper,
  WrapBufferHelper,
  WrapInputHelper,
  WrapNullHelper,
  WrapNumberHelper,
  WrapObjectHelper,
  WrapOutputHelper,
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
  readonly arrFilter: (options: ArrFilterHelperOptions) => ArrFilterHelper;
  readonly arrFilterFunc: ArrFilterFuncHelper;
  readonly arrMap: (options: ArrMapHelperOptions) => ArrMapHelper;
  readonly arrMapFunc: ArrMapFuncHelper;
  readonly arrForEach: (options: ArrForEachHelperOptions) => ArrForEachHelper;
  readonly arrForEachFunc: ArrForEachFuncHelper;
  readonly arrRange: (options: ArrRangeHelperOptions) => ArrRangeHelper;
  readonly arrReduce: (options: ArrReduceHelperOptions) => ArrReduceHelper;
  readonly arrReduceFunc: ArrReduceFuncHelper;
  readonly extendArr: ExtendArrHelper;

  // arrayIterableIterator
  readonly createArrayIterableIterator: CreateArrayIterableIteratorHelper;
  readonly getArrayIterableIteratorClass: GetArrayIterableIteratorClassHelper;

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
  readonly genericDeserialize: GenericDeserializeHelper;
  readonly genericSerialize: GenericSerializeHelper;
  readonly exp: ExpHelper;
  readonly consoleLog: ConsoleLogHelper;
  readonly debugLog: (options: DebugLogHelperOptions) => DebugLogHelper;

  // error
  readonly getErrorClass: GetErrorClassHelper;

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
  readonly toString: (options: TypedHelperOptions) => ToStringHelper;
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

  // map
  readonly getMapClass: GetMapClassHelper;

  // storage
  readonly getMapStorageClass: GetMapStorageClassHelper;
  readonly getSetStorageClass: GetSetStorageClassHelper;

  // types
  readonly forBuiltinType: (options: ForBuiltinTypeHelperOptions) => ForBuiltinTypeHelper;
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

  // types/input
  readonly wrapInput: WrapInputHelper;
  readonly unwrapInput: UnwrapInputHelper;
  readonly isInput: IsInputHelper;

  // types/output
  readonly wrapOutput: WrapOutputHelper;
  readonly unwrapOutput: UnwrapOutputHelper;
  readonly isOutput: IsOutputHelper;

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
    arrFilter: (options) => new ArrFilterHelper(options),
    arrFilterFunc: new ArrFilterFuncHelper(),
    arrMap: (options) => new ArrMapHelper(options),
    arrMapFunc: new ArrMapFuncHelper(),
    arrForEach: (options) => new ArrForEachHelper(options),
    arrForEachFunc: new ArrForEachFuncHelper(),
    arrRange: (options) => new ArrRangeHelper(options),
    arrReduce: (options) => new ArrReduceHelper(options),
    arrReduceFunc: new ArrReduceFuncHelper(),
    extendArr: new ExtendArrHelper(),

    // arrayIterableIterator
    createArrayIterableIterator: new CreateArrayIterableIteratorHelper(),
    getArrayIterableIteratorClass: new GetArrayIterableIteratorClassHelper(),

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
    genericDeserialize: new GenericDeserializeHelper(),
    genericSerialize: new GenericSerializeHelper(),
    exp: new ExpHelper(),
    consoleLog: new ConsoleLogHelper(),
    debugLog: (options) => new DebugLogHelper(options),

    // error
    getErrorClass: new GetErrorClassHelper(),

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

    // map
    getMapClass: new GetMapClassHelper(),

    // set
    getMapStorageClass: new GetMapStorageClassHelper(),
    getSetStorageClass: new GetSetStorageClassHelper(),

    // types
    forBuiltinType: (options) => new ForBuiltinTypeHelper(options),
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

    // types/input
    wrapInput: new WrapInputHelper(),
    unwrapInput: new UnwrapInputHelper(),
    isInput: new IsInputHelper(),

    // types/output
    wrapOutput: new WrapOutputHelper(),
    unwrapOutput: new UnwrapOutputHelper(),
    isOutput: new IsOutputHelper(),

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
