declare module 'mali' {
  export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;
  export type Context = any;

  type Mali = any;
  const Mali: Mali;
  export default Mali;
}
