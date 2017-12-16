/* @flow */
// flowlint untyped-import:off
// flowlint-next-line untyped-type-import:off
import type { Context } from 'mali';
import type { Log, LogData, LogMessage } from '@neo-one/utils';

import _ from 'lodash';
import uuidV4 from 'uuid/v4';

const addLogData = (extraData: LogData, log: Log): Log => (
  message: LogMessage,
  callback?: () => void,
) => {
  log(_.merge(extraData, message), callback);
};

const getLoggingData = (ctx: Context): LogData => ({
  fullName: ctx.fullName,
  type: ctx.type,
  metadata: ctx.metadata,
  get response() {
    return {
      status: ctx.response.status,
      metadata: ctx.response.metadata,
    };
  },
  id: uuidV4(),
});

const createLogForContext = (log: Log, ctx: Context) =>
  addLogData(getLoggingData(ctx), log);

export default ({ log }: {| log: Log |}) => async (
  ctx: Context,
  next: () => Promise<void>,
) => {
  ctx.state = {};
  ctx.state.log = createLogForContext(log, ctx);

  await next();
};
