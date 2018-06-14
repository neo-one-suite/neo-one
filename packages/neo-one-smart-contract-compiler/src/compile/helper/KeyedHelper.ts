export interface KeyedHelper<Options> {
  readonly getKey: (options: Options) => string;
}
