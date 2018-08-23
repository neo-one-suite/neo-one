declare module 'koa-cors' {
  import Koa from 'koa';

  type Cors = (ctx: Koa.Context, next: () => void) => Generator;
  export default function(options: { origin: boolean | string }): Cors;
}
