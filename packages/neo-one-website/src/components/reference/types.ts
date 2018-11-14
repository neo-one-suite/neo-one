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
  readonly slug: string | undefined;
  readonly value: string;
}

export type WordTokens = ReadonlyArray<WordToken>;

export interface Parameter {
  readonly name: string;
  readonly type: WordTokens;
  readonly description: WordTokens;
}

export interface ReferenceItem {
  readonly name: string;
  readonly slug: string;
  readonly type: ReferenceType;
  readonly description: WordTokens;
  readonly definition: WordTokens;
  readonly parameters?: ReadonlyArray<Parameter>;
}
