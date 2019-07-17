// tslint:disable no-any
import * as opentracing from 'opentracing';

import { Tracer, TracerReference, TracerSpan } from './MonitorBase';
import { SpanContext } from './types';

export const createTracer = (tracer: opentracing.Tracer = new opentracing.Tracer()): Tracer => {
  const getSpan = (span: SpanContext | TracerSpan): SpanContext => {
    if ((span as any).context != undefined) {
      return (span as any).context();
    }

    return span as any;
  };

  return {
    startSpan: (name, options): TracerSpan => tracer.startSpan(name, options as any) as any,
    childOf: (span): TracerReference => opentracing.childOf(getSpan(span) as any) as any,
    followsFrom: (span): TracerReference => opentracing.followsFrom(getSpan(span) as any) as any,
    extract: (format, carrier): SpanContext | undefined => {
      const result = tracer.extract(format, carrier) as any;

      return result == undefined ? undefined : result;
    },
    inject: (context, format, carrier): void => tracer.inject(context as any, format, carrier),
    close: (callback) => {
      if ((tracer as any).close == undefined) {
        callback();
      } else {
        (tracer as any).close(callback);
      }
    },
  };
};
