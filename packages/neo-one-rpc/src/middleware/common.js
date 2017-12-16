/* @flow */
import type { Context, Middleware } from 'koa';
import type { Log, Profile } from '@neo-one/utils';

export const getLog = (ctx: Context): Log => {
  const { log } = ctx.state;
  if (log == null) {
    ctx.throw(500);
    throw new Error('For Flow');
  }
  return log;
};

export const getProfile = (ctx: Context): Profile => {
  const { profile } = ctx.state;
  if (profile == null) {
    ctx.throw(500);
    throw new Error('For Flow');
  }
  return profile;
};

export type ServerMiddleware = {|
  name: string,
  middleware: Middleware,
|};

export const simpleMiddleware = (
  name: string,
  middleware: Middleware,
): ServerMiddleware => ({
  name,
  middleware,
});
