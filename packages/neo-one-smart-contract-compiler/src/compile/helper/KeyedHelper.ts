export interface KeyedHelper<Options> {
  getKey(options: Options): string;
}
