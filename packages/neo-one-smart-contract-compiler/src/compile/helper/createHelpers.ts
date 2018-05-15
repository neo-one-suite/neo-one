import { Helper } from './Helper';
import {
  CloneArrayHelper,
  ExtendArrayHelper,
  ArrMapHelper,
  ArrMapHelperOptions,
  ArrForEachHelperOptions,
  ArrForEachHelper,
  ForTypeHelper,
  ForTypeHelperOptions,
  GenericSerializeHelper,
  GenericDeserializeHelper,
  ArrFilterHelperOptions,
  ArrFilterHelper,
  TypedHelperOptions,
} from './common';
import {
  HandleCompletionHelper,
  CreateCompletionHelper,
  CreateNormalCompletionHelper,
  CreateThrowCompletionHelper,
  GetCompletionErrorHelper,
  GetCompletionValHelper,
  PickCompletionValHelper,
} from './completionRecord';
import { ThrowHelper, ThrowTypeErrorHelper } from './error';
import {
  CallHelper,
  CreateFunctionObjectHelper,
  FunctionHelper,
  FunctionHelperOptions,
  ParametersHelper,
  CloneFunctionHelper,
  ArgumentsHelper,
  CloneFunctionObjectHelperOptions,
  CloneFunctionObjectHelper,
  BindFunctionThisHelper,
  BindFunctionObjectThisHelperOptions,
  BindFunctionObjectThisHelper,
  BindFunctionThisHelperOptions,
  InvokeCallHelper,
  InvokeConstructHelper,
  InvokeCallHelperOptions,
  InvokeConstructHelperOptions,
  CreateCallArrayHelper,
  CreateConstructArrayHelperOptions,
  CreateConstructArrayHelper,
  CreateFunctionObjectHelperOptions,
  CreateFunctionArrayHelperOptions,
  CreateFunctionArrayHelper,
  NewHelperOptions,
  NewHelper,
} from './function';
import {
  ForLoopHelper,
  ForLoopHelperOptions,
  ProcessStatementsHelper,
  ProcessStatementsHelperOptions,
  IfHelper,
  IfHelperOptions,
  Case,
  CaseHelper,
} from './statement';
import {
  CreateBooleanHelper,
  CreateNullHelper,
  CreateNumberHelper,
  CreateObjectHelper,
  CreateStringHelper,
  CreateSymbolHelper,
  CreateUndefinedHelper,
  IsBooleanHelper,
  IsNullHelper,
  IsNumberHelper,
  IsObjectHelper,
  IsStringHelper,
  IsSymbolHelper,
  IsUndefinedHelper,
  GetBooleanHelper,
  GetNumberHelper,
  GetSymbolHelper,
  GetPropertyObjectHelper,
  GetStringHelper,
  ToBooleanHelper,
  ToNumberHelper,
  ToStringHelper,
  GetSymbolObjectHelper,
  GetSymbolObjectPropertyHelper,
  GetInternalObjectHelper,
  GetInternalObjectPropertyHelper,
  GetPropertyObjectPropertyHelper,
  SetAccessorPropertyObjectPropertyHelper,
  SetDataPropertyObjectPropertyHelper,
  ToPrimitiveHelper,
  ToPrimitiveHelperOptions,
  IsSameTypeHelper,
  UnwrapTypeHelper,
  UnwrapValHelper,
  IsNullOrUndefinedHelper,
  GetObjectHelper,
  SetInternalObjectPropertyHelper,
  SetAccessorSymbolObjectPropertyHelper,
  SetDataSymbolObjectPropertyHelper,
  ShallowCloneObjectHelper,
  ShallowCloneObjHelper,
  ToObjectHelper,
  InstanceofHelper,
  CreatePropertyObjectHelper,
  ElementAccessHelper,
  SetObjectAccessorPropertyHelperBaseOptions,
  FindObjectPropertyHelperOptions,
  FindObjectPropertyHelper,
  SetPropertyObjectPropertyHelper,
  SetSymbolObjectPropertyHelper,
} from './types';
import {
  LessThanHelperOptions,
  LessThanHelper,
  EqualsEqualsEqualsHelperOptions,
  EqualsEqualsEqualsHelper,
  EqualsEqualsEqualsNumberHelper,
  EqualsEqualsEqualsSameTypeHelper,
  EqualsEqualsEqualsUnknownHelper,
  EqualsEqualsHelper,
  EqualsEqualsHelperOptions,
} from './relational';
import {
  GLOBAL_PROPERTIES,
  SetGlobalObjectHelper,
  AddBooleanObjectHelper,
  AddNumberObjectHelper,
  AddObjectObjectHelper,
  AddStringObjectHelper,
  AddSymbolObjectHelper,
  AddArrayObjectHelper,
  AddModulesHelper,
  GetGlobalPropertyHelper,
  GetGlobalPropertyHelperOptions,
  AddBufferObjectHelper,
  AddErrorObjectHelper,
  AddArgumentsHelper,
  GetArgumentHelper,
} from './global';
import {
  CreateArrayHelper,
  GetArrayValueHelper,
  SetArrayIndexHelper,
  SetArrayValueHelper,
  GetArrayIndexHelper,
  WrapArrayHelper,
  UnwrapArrayHelper,
} from './array';
import {
  AddEmptyModuleHelper,
  GetModuleHelperOptions,
  GetModuleHelper,
  GetModulesHelper,
  GetCurrentModuleHelper,
  ExportHelperOptions,
  ExportHelper,
  ExportSingleHelper,
} from './module';
import {
  IsBlockchainInterfaceHelperOptions,
  IsBlockchainInterfaceHelper,
  WrapBlockchainInterfaceHelperOptions,
  WrapBlockchainInterfaceHelper,
  UnwrapBlockchainInterfaceHelper,
} from './blockchain';
import {
  CreateBufferHelper,
  GetBufferValueHelper,
  SetBufferValueHelper,
  UnwrapBufferHelper,
  WrapBufferHelper,
} from './buffer';
import { KeyedHelper } from './KeyedHelper';

export interface Helpers {
  arrFilter: (options: ArrFilterHelperOptions) => ArrFilterHelper;
  arrMap: (options: ArrMapHelperOptions) => ArrMapHelper;
  arrForEach: (options: ArrForEachHelperOptions) => ArrForEachHelper;
  cloneArray: CloneArrayHelper;
  extendArray: ExtendArrayHelper;
  forType: (options: ForTypeHelperOptions) => ForTypeHelper;
  genericDeserialize: GenericDeserializeHelper;
  genericSerialize: GenericSerializeHelper;

  equalsEqualsEquals: (
    options: EqualsEqualsEqualsHelperOptions,
  ) => EqualsEqualsEqualsHelper;
  equalsEqualsEqualsNumber: EqualsEqualsEqualsNumberHelper;
  equalsEqualsEqualsSameType: EqualsEqualsEqualsSameTypeHelper;
  equalsEqualsEqualsUnknown: EqualsEqualsEqualsUnknownHelper;
  equalsEquals: (options: EqualsEqualsHelperOptions) => EqualsEqualsHelper;
  lessThan: (options: LessThanHelperOptions) => LessThanHelper;
  processStatements: (
    options: ProcessStatementsHelperOptions,
  ) => ProcessStatementsHelper;

  args: ArgumentsHelper;
  bindFunctionObjectThis: (
    options: BindFunctionObjectThisHelperOptions,
  ) => BindFunctionObjectThisHelper;
  bindFunctionThis: (
    options: BindFunctionThisHelperOptions,
  ) => BindFunctionThisHelper;
  call: CallHelper;
  cloneFunction: CloneFunctionHelper;
  cloneFunctionObject: (
    options: CloneFunctionObjectHelperOptions,
  ) => CloneFunctionObjectHelper;
  createCallArray: CreateCallArrayHelper;
  createConstructArray: (
    options: CreateConstructArrayHelperOptions,
  ) => CreateConstructArrayHelper;
  createFunctionArray: (
    options: CreateFunctionArrayHelperOptions,
  ) => CreateFunctionArrayHelper;
  createFunctionObject: (
    options: CreateFunctionObjectHelperOptions,
  ) => CreateFunctionObjectHelper;
  function: (options: FunctionHelperOptions) => FunctionHelper;
  invokeCall: (options?: InvokeCallHelperOptions) => InvokeCallHelper;
  invokeConstruct: (
    options?: InvokeConstructHelperOptions,
  ) => InvokeConstructHelper;
  new: (options?: NewHelperOptions) => NewHelper;
  parameters: ParametersHelper;

  forLoop: (options: ForLoopHelperOptions) => ForLoopHelper;
  if: (options: IfHelperOptions) => IfHelper;
  case: (cases: Case[], defaultCase: () => void) => CaseHelper;
  createCompletion: CreateCompletionHelper;
  createNormalCompletion: CreateNormalCompletionHelper;
  createThrowCompletion: CreateThrowCompletionHelper;
  getCompletionError: GetCompletionErrorHelper;
  getCompletionVal: GetCompletionValHelper;
  handleCompletion: HandleCompletionHelper;
  pickCompletionVal: PickCompletionValHelper;
  throw: ThrowHelper;
  throwTypeError: ThrowTypeErrorHelper;
  createBoolean: CreateBooleanHelper;
  createNull: CreateNullHelper;
  createNumber: CreateNumberHelper;
  createObject: CreateObjectHelper;
  createString: CreateStringHelper;
  createSymbol: CreateSymbolHelper;
  createUndefined: CreateUndefinedHelper;
  isBoolean: IsBooleanHelper;
  isNull: IsNullHelper;
  isNumber: IsNumberHelper;
  isObject: IsObjectHelper;
  isString: IsStringHelper;
  isSymbol: IsSymbolHelper;
  isUndefined: IsUndefinedHelper;
  isNullOrUndefined: IsNullOrUndefinedHelper;
  isSameType: IsSameTypeHelper;
  getBoolean: GetBooleanHelper;
  getNumber: GetNumberHelper;
  getString: GetStringHelper;
  getSymbol: GetSymbolHelper;
  getObject: GetObjectHelper;
  toBoolean: (options: TypedHelperOptions) => ToBooleanHelper;
  toString: (options: TypedHelperOptions) => ToStringHelper;
  toNumber: (options: TypedHelperOptions) => ToNumberHelper;
  toObject: (options: TypedHelperOptions) => ToObjectHelper;
  toPrimitive: (options: ToPrimitiveHelperOptions) => ToPrimitiveHelper;
  getSymbolObject: GetSymbolObjectHelper;
  getSymbolObjectProperty: GetSymbolObjectPropertyHelper;
  setSymbolObjectProperty: SetSymbolObjectPropertyHelper;
  setDataSymbolObjectProperty: SetDataSymbolObjectPropertyHelper;
  setAccessorSymbolObjectProperty: (
    options: SetObjectAccessorPropertyHelperBaseOptions,
  ) => SetAccessorSymbolObjectPropertyHelper;
  getPropertyObject: GetPropertyObjectHelper;
  getPropertyObjectProperty: GetPropertyObjectPropertyHelper;
  setPropertyObjectProperty: SetPropertyObjectPropertyHelper;
  setDataPropertyObjectProperty: SetDataPropertyObjectPropertyHelper;
  setAccessorPropertyObjectProperty: (
    options: SetObjectAccessorPropertyHelperBaseOptions,
  ) => SetAccessorPropertyObjectPropertyHelper;
  getInternalObject: GetInternalObjectHelper;
  getInternalObjectProperty: GetInternalObjectPropertyHelper;
  setInternalObjectProperty: SetInternalObjectPropertyHelper;
  shallowCloneObject: ShallowCloneObjectHelper;
  shallowCloneObj: ShallowCloneObjHelper;
  elementAccess: ElementAccessHelper;
  unwrapType: UnwrapTypeHelper;
  unwrapVal: UnwrapValHelper;
  instanceof: InstanceofHelper;
  createPropertyObject: CreatePropertyObjectHelper;
  findObjectProperty: (
    options: FindObjectPropertyHelperOptions,
  ) => FindObjectPropertyHelper;

  getArrayValue: GetArrayValueHelper;
  createArray: CreateArrayHelper;
  setArrayValue: SetArrayValueHelper;
  getArrayIndex: GetArrayIndexHelper;
  setArrayIndex: SetArrayIndexHelper;
  wrapArray: WrapArrayHelper;
  unwrapArray: UnwrapArrayHelper;

  createBuffer: CreateBufferHelper;
  getBufferValue: GetBufferValueHelper;
  setBufferValue: SetBufferValueHelper;
  unwrapBuffer: UnwrapBufferHelper;
  wrapBuffer: WrapBufferHelper;

  export: (options: ExportHelperOptions) => ExportHelper;
  exportSingle: (options: ExportHelperOptions) => ExportSingleHelper;
  getModule: (options: GetModuleHelperOptions) => GetModuleHelper;
  getCurrentModule: GetCurrentModuleHelper;
  getModules: GetModulesHelper;
  addEmptyModule: AddEmptyModuleHelper;

  isBlockchainInterface: (
    options: IsBlockchainInterfaceHelperOptions,
  ) => IsBlockchainInterfaceHelper;
  wrapBlockchainInterface: (
    options: WrapBlockchainInterfaceHelperOptions,
  ) => WrapBlockchainInterfaceHelper;
  unwrapBlockchainInterface: UnwrapBlockchainInterfaceHelper;

  addArguments: AddArgumentsHelper;
  addArrayObject: AddArrayObjectHelper;
  addBooleanObject: AddBooleanObjectHelper;
  addBufferObject: AddBufferObjectHelper;
  addErrorObject: AddErrorObjectHelper;
  addModules: AddModulesHelper;
  addNumberObject: AddNumberObjectHelper;
  addObjectObject: AddObjectObjectHelper;
  addStringObject: AddStringObjectHelper;
  addSymbolObject: AddSymbolObjectHelper;
  setGlobalObject: SetGlobalObjectHelper;
  getArgument: (options: TypedHelperOptions) => GetArgumentHelper;
  getGlobalProperty: (
    options: GetGlobalPropertyHelperOptions,
  ) => GetGlobalPropertyHelper;
  globalProperties: Set<string>;
}

export const createHelpers = (): Helpers => {
  const cache: { [key: string]: Helper } = {};

  function memoized<Options, T extends Helper>(
    HelperClass: (new (options: Options) => T) & KeyedHelper<Options>,
  ): (options: Options) => T {
    return (options: Options) => {
      const key = HelperClass.getKey(options);
      if (cache[key] == null) {
        cache[key] = new HelperClass(options);
      }

      return cache[key] as T;
    };
  }

  return {
    arrFilter: (options: ArrFilterHelperOptions) =>
      new ArrFilterHelper(options),
    arrMap: (options: ArrMapHelperOptions) => new ArrMapHelper(options),
    arrForEach: (options: ArrForEachHelperOptions) =>
      new ArrForEachHelper(options),
    cloneArray: new CloneArrayHelper(),
    extendArray: new ExtendArrayHelper(),
    forType: (options: ForTypeHelperOptions) => new ForTypeHelper(options),
    genericDeserialize: new GenericDeserializeHelper(),
    genericSerialize: new GenericSerializeHelper(),

    equalsEqualsEquals: (options: EqualsEqualsEqualsHelperOptions) =>
      new EqualsEqualsEqualsHelper(options),
    equalsEqualsEqualsNumber: new EqualsEqualsEqualsNumberHelper(),
    equalsEqualsEqualsSameType: new EqualsEqualsEqualsSameTypeHelper(),
    equalsEqualsEqualsUnknown: new EqualsEqualsEqualsUnknownHelper(),
    equalsEquals: (options: EqualsEqualsHelperOptions) =>
      new EqualsEqualsHelper(options),
    lessThan: (options: LessThanHelperOptions) => new LessThanHelper(options),
    processStatements: (options) => new ProcessStatementsHelper(options),

    args: new ArgumentsHelper(),
    bindFunctionObjectThis: (options: BindFunctionObjectThisHelperOptions) =>
      new BindFunctionObjectThisHelper(options),
    bindFunctionThis: (options: BindFunctionThisHelperOptions) =>
      new BindFunctionThisHelper(options),
    call: new CallHelper(),
    cloneFunction: new CloneFunctionHelper(),
    cloneFunctionObject: (options: CloneFunctionObjectHelperOptions) =>
      new CloneFunctionObjectHelper(options),
    createCallArray: new CreateCallArrayHelper(),
    createConstructArray: (options: CreateConstructArrayHelperOptions) =>
      new CreateConstructArrayHelper(options),
    createFunctionArray: (options: CreateFunctionArrayHelperOptions) =>
      new CreateFunctionArrayHelper(options),
    createFunctionObject: (options: CreateFunctionObjectHelperOptions) =>
      new CreateFunctionObjectHelper(options),
    function: (options: FunctionHelperOptions) => new FunctionHelper(options),
    invokeCall: memoized(InvokeCallHelper),
    invokeConstruct: (options?: InvokeConstructHelperOptions) =>
      new InvokeConstructHelper(options),
    new: (options?: NewHelperOptions) => new NewHelper(options),
    parameters: new ParametersHelper(),

    forLoop: (options) => new ForLoopHelper(options),
    if: (options) => new IfHelper(options),
    case: (cases: Case[], defaultCase: () => void) =>
      new CaseHelper(cases, defaultCase),
    createCompletion: new CreateCompletionHelper(),
    createNormalCompletion: new CreateNormalCompletionHelper(),
    createThrowCompletion: new CreateThrowCompletionHelper(),
    getCompletionError: new GetCompletionErrorHelper(),
    getCompletionVal: new GetCompletionValHelper(),
    handleCompletion: new HandleCompletionHelper(),
    pickCompletionVal: new PickCompletionValHelper(),
    throw: new ThrowHelper(),
    throwTypeError: new ThrowTypeErrorHelper(),
    createBoolean: new CreateBooleanHelper(),
    createNull: new CreateNullHelper(),
    createNumber: new CreateNumberHelper(),
    createObject: new CreateObjectHelper(),
    createString: new CreateStringHelper(),
    createSymbol: new CreateSymbolHelper(),
    createUndefined: new CreateUndefinedHelper(),
    isBoolean: new IsBooleanHelper(),
    isNull: new IsNullHelper(),
    isNumber: new IsNumberHelper(),
    isObject: new IsObjectHelper(),
    isString: new IsStringHelper(),
    isSymbol: new IsSymbolHelper(),
    isUndefined: new IsUndefinedHelper(),
    isNullOrUndefined: new IsNullOrUndefinedHelper(),
    isSameType: new IsSameTypeHelper(),
    getBoolean: new GetBooleanHelper(),
    getNumber: new GetNumberHelper(),
    getString: new GetStringHelper(),
    getSymbol: new GetSymbolHelper(),
    getObject: new GetObjectHelper(),
    toBoolean: (options: TypedHelperOptions) => new ToBooleanHelper(options),
    toString: (options: TypedHelperOptions) => new ToStringHelper(options),
    toNumber: (options: TypedHelperOptions) => new ToNumberHelper(options),
    toObject: (options: TypedHelperOptions) => new ToObjectHelper(options),
    toPrimitive: (options) => new ToPrimitiveHelper(options),
    getSymbolObject: new GetSymbolObjectHelper(),
    getSymbolObjectProperty: new GetSymbolObjectPropertyHelper(),
    setSymbolObjectProperty: new SetSymbolObjectPropertyHelper(),
    setDataSymbolObjectProperty: new SetDataSymbolObjectPropertyHelper(),
    setAccessorSymbolObjectProperty: (
      options: SetObjectAccessorPropertyHelperBaseOptions,
    ) => new SetAccessorSymbolObjectPropertyHelper(options),
    getPropertyObject: new GetPropertyObjectHelper(),
    getPropertyObjectProperty: new GetPropertyObjectPropertyHelper(),
    setPropertyObjectProperty: new SetPropertyObjectPropertyHelper(),
    setDataPropertyObjectProperty: new SetDataPropertyObjectPropertyHelper(),
    setAccessorPropertyObjectProperty: (
      options: SetObjectAccessorPropertyHelperBaseOptions,
    ) => new SetAccessorPropertyObjectPropertyHelper(options),
    getInternalObject: new GetInternalObjectHelper(),
    getInternalObjectProperty: new GetInternalObjectPropertyHelper(),
    setInternalObjectProperty: new SetInternalObjectPropertyHelper(),
    shallowCloneObject: new ShallowCloneObjectHelper(),
    shallowCloneObj: new ShallowCloneObjHelper(),
    elementAccess: new ElementAccessHelper(),
    unwrapType: new UnwrapTypeHelper(),
    unwrapVal: new UnwrapValHelper(),
    instanceof: new InstanceofHelper(),
    createPropertyObject: new CreatePropertyObjectHelper(),
    findObjectProperty: (options: FindObjectPropertyHelperOptions) =>
      new FindObjectPropertyHelper(options),

    getArrayValue: new GetArrayValueHelper(),
    createArray: new CreateArrayHelper(),
    setArrayValue: new SetArrayValueHelper(),
    getArrayIndex: new GetArrayIndexHelper(),
    setArrayIndex: new SetArrayIndexHelper(),
    wrapArray: new WrapArrayHelper(),
    unwrapArray: new UnwrapArrayHelper(),

    createBuffer: new CreateBufferHelper(),
    getBufferValue: new GetBufferValueHelper(),
    setBufferValue: new SetBufferValueHelper(),
    unwrapBuffer: new UnwrapBufferHelper(),
    wrapBuffer: new WrapBufferHelper(),

    export: (options: ExportHelperOptions) => new ExportHelper(options),
    exportSingle: (options: ExportHelperOptions) =>
      new ExportSingleHelper(options),
    getModule: (options: GetModuleHelperOptions) =>
      new GetModuleHelper(options),
    getCurrentModule: new GetCurrentModuleHelper(),
    getModules: new GetModulesHelper(),
    addEmptyModule: new AddEmptyModuleHelper(),

    isBlockchainInterface: (options: IsBlockchainInterfaceHelperOptions) =>
      new IsBlockchainInterfaceHelper(options),
    wrapBlockchainInterface: (options: WrapBlockchainInterfaceHelperOptions) =>
      new WrapBlockchainInterfaceHelper(options),
    unwrapBlockchainInterface: new UnwrapBlockchainInterfaceHelper(),

    addArguments: new AddArgumentsHelper(),
    addArrayObject: new AddArrayObjectHelper(),
    addBooleanObject: new AddBooleanObjectHelper(),
    addBufferObject: new AddBufferObjectHelper(),
    addErrorObject: new AddErrorObjectHelper(),
    addModules: new AddModulesHelper(),
    addNumberObject: new AddNumberObjectHelper(),
    addObjectObject: new AddObjectObjectHelper(),
    addStringObject: new AddStringObjectHelper(),
    addSymbolObject: new AddSymbolObjectHelper(),
    setGlobalObject: new SetGlobalObjectHelper(),
    getArgument: (options: TypedHelperOptions) =>
      new GetArgumentHelper(options),
    getGlobalProperty: (options: GetGlobalPropertyHelperOptions) =>
      new GetGlobalPropertyHelper(options),
    globalProperties: GLOBAL_PROPERTIES,
  };
};
