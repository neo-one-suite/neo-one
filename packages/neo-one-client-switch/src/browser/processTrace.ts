import { ProcessTraceOptions, ProcessTraceResult } from '../common';

export const processTrace = async ({
  trace,
}: ProcessTraceOptions): Promise<ReadonlyArray<ProcessTraceResult | undefined>> => trace.map(() => undefined);
