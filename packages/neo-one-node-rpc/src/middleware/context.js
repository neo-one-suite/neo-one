/* @flow */
import type { Context } from 'koa';
import type { Log, Profile } from '@neo-one/utils';

import { simpleMiddleware } from './common';

export type CreateLogForContext = (ctx: Context) => Log;
export type CreateProfile = (log: Log) => Profile;

export default ({
  createLog,
  createProfile,
}: {|
  createLog: CreateLogForContext,
  createProfile: CreateProfile,
|}) =>
  simpleMiddleware(
    'context',
    async (ctx: Context, next: () => Promise<void>) => {
      const log = createLog(ctx);
      ctx.state.log = log;
      ctx.state.profile = createProfile(log);

      await next();
    },
  );
