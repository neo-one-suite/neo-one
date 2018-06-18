import Koa from 'koa';

export default function convert(mw: (ctx: Koa.Context, next: () => void) => Generator): Koa.Middleware;
