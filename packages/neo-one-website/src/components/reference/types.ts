export type ReferenceType = 'Function' | 'Class' | 'Const' | 'Interface' | 'Enum' | 'Decorator' | 'Type Alias';

export type TypeFilterOptions = 'All' | ReferenceType;

export const TYPE_FILTER_OPTIONS: ReadonlyArray<TypeFilterOptions> = [
  'All',
  'Function',
  'Class',
  'Const',
  'Interface',
  'Enum',
  'Decorator',
  'Type Alias',
];

export interface WordToken {
  readonly slug?: string | undefined;
  readonly value: string;
}

export type WordTokens = ReadonlyArray<WordToken>;

export interface Parameter {
  readonly name: string;
  readonly type?: WordTokens;
  readonly description: WordTokens;
}

export interface FunctionData {
  readonly parameters?: ReadonlyArray<Parameter>;
  readonly returns?: WordTokens;
}

export interface Method {
  readonly functionData: FunctionData;
  readonly title: string;
  readonly description?: WordTokens;
  readonly definition: WordTokens;
  readonly extra?: ReadonlyArray<ExtraData>;
}

export interface Property extends Parameter {}

export interface InterfaceData {
  readonly constructorDefinition?: Method;
  readonly properties?: ReadonlyArray<Property>;
  readonly methods?: ReadonlyArray<Method>;
  readonly staticMethods?: ReadonlyArray<Method>;
}

export interface ClassData extends InterfaceData {}

export interface EnumMember extends Parameter {}

export interface EnumData {
  readonly members: ReadonlyArray<EnumMember>;
}

export interface ConstData extends InterfaceData {}

export interface ExtraData {
  readonly title?: string;
  readonly code?: boolean;
  readonly data: WordTokens;
}

export interface ReferenceItem {
  readonly name: string;
  readonly slug: string;
  readonly type: ReferenceType;
  readonly description: WordTokens;
  readonly definition: WordTokens;
  readonly functionData?: FunctionData;
  readonly classData?: ClassData;
  readonly enumData?: EnumData;
  readonly constData?: ConstData;
  readonly interfaceData?: InterfaceData;
  readonly extra?: ReadonlyArray<ExtraData>;
}
