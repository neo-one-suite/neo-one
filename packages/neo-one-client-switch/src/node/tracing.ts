// tslint:disable no-implicit-dependencies
// @ts-ignore
import {
  AggregationType,
  Exporter,
  globalStats,
  Measure,
  MeasureUnit,
  NoopExporter,
  Span,
  SpanKind,
  TagMap,
} from '@opencensus/core';
import { TracingBase } from '@opencensus/nodejs-base';
import { TraceContextFormat } from '@opencensus/propagation-tracecontext';

const tracing = TracingBase.instance;
const tracer = tracing.tracer;

const startTracing = (exporter: Exporter) => {
  tracing.start({
    propagation: new TraceContextFormat(),
    exporter,
  });

  return () => {
    tracing.unregisterExporter(exporter);
    tracing.stop();
  };
};

export {
  startTracing,
  TraceContextFormat,
  tracer,
  AggregationType,
  globalStats,
  Measure,
  MeasureUnit,
  Span,
  SpanKind,
  TagMap,
  NoopExporter,
};
