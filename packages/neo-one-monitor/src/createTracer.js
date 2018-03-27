/* @flow */
import * as opentracing from 'opentracing';

import type { Carrier, Format, SpanContext } from './types';
import type {
  Tracer,
  TracerReference,
  TracerStartSpanOptions,
  TracerSpan,
} from './MonitorBase';

export default (tracerIn?: opentracing.Tracer): Tracer => {
  const tracer = tracerIn || new opentracing.Tracer();
  const getSpan = (span: SpanContext | TracerSpan): SpanContext => {
    if ((span: $FlowFixMe).context != null) {
      return (span: $FlowFixMe).context();
    }

    return (span: $FlowFixMe);
  };
  return {
    startSpan: (name: string, options?: TracerStartSpanOptions): TracerSpan =>
      tracer.startSpan(name, options),
    childOf: (span: SpanContext | TracerSpan): TracerReference =>
      opentracing.childOf(getSpan(span)),
    followsFrom: (span: SpanContext | TracerSpan): TracerReference =>
      opentracing.followsFrom(getSpan(span)),
    extract: (format: Format, carrier: Carrier): SpanContext =>
      tracer.extract(format, carrier),
    inject: (context: SpanContext, format: Format, carrier: Carrier): void =>
      tracer.inject(context, format, carrier),
    close: (callback: () => void) => {
      if (tracer.close == null) {
        callback();
      } else {
        tracer.close(callback);
      }
    },
  };
};
