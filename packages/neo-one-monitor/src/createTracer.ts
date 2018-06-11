import * as opentracing from 'opentracing';

import { Carrier, Format, SpanContext } from './types';
import {
  Tracer,
  TracerReference,
  TracerStartSpanOptions,
  TracerSpan,
} from './MonitorBase';

export const createTracer = (tracerIn?: opentracing.Tracer): Tracer => {
  const tracer = tracerIn || new opentracing.Tracer();
  const getSpan = (span: SpanContext | TracerSpan): SpanContext => {
    if ((span as any).context != null) {
      return (span as any).context();
    }

    return span as any;
  };
  return {
    startSpan: (name: string, options?: TracerStartSpanOptions): TracerSpan =>
      tracer.startSpan(name, options) as any,
    childOf: (span: SpanContext | TracerSpan): TracerReference =>
      opentracing.childOf(getSpan(span)),
    followsFrom: (span: SpanContext | TracerSpan): TracerReference =>
      opentracing.followsFrom(getSpan(span)),
    extract: (format: Format, carrier: Carrier): SpanContext | null =>
      tracer.extract(format, carrier) as any,
    inject: (context: SpanContext, format: Format, carrier: Carrier): void =>
      tracer.inject(context, format, carrier),
    close: (callback: () => void) => {
      if ((tracer as any).close == null) {
        callback();
      } else {
        (tracer as any).close(callback);
      }
    },
  };
};
