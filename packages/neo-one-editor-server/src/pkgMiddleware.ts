import { Context } from 'koa';
import { resolvePackage } from './resolvePackage';

export const pkgMiddleware = async (ctx: Context): Promise<void> => {
  const result = await resolvePackage(ctx.query.name, ctx.query.version);

  const directives = [`max-age=${365 * 24 * 60 * 60}`, 'immutable', 'public'];
  ctx.set('Cache-Control', directives.join(', '));
  ctx.body = result;
  ctx.status = 200;
};
