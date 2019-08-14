// tslint:disable: no-submodule-imports
import { tracing } from '@opencensus/web-core';
import { NoopExporter } from '@opencensus/web-core/build/src/exporters/noop_exporter';
import { TraceContextFormat } from '@opencensus/web-propagation-tracecontext';
import { Exporter, Span, SpanKind } from '@opencensus/web-types';
import { AggregationType, Measure, MeasureUnit, Stats } from '@opencensus/web-types/build/src/stats/types';
import { TagMap } from '@opencensus/web-types/build/src/tags/tag-map';

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

// tslint:disable-next-line: no-any
const noOp = (..._args: readonly any[]): any => {
  //
};

const globalStats: Stats = {
  createView: noOp,
  registerView: noOp,
  createMeasureDouble: noOp,
  createMeasureInt64: noOp,
  record: noOp,
  clear: noOp,
  getMetrics: noOp,
  registerExporter: noOp,
  unregisterExporter: noOp,
  withTagContext: noOp,
  getCurrentTagContext: noOp,
};

const PrometheusStatsExporter = {
  onRegisterView: noOp,
  onRecord: noOp,
  start: noOp,
  stop: noOp,
};
const JaegerTraceExporter = NoopExporter;

export {
  AggregationType,
  globalStats,
  JaegerTraceExporter,
  Measure,
  MeasureUnit,
  NoopExporter,
  PrometheusStatsExporter,
  Span,
  SpanKind,
  startTracing,
  TagMap,
  TraceContextFormat,
  tracer,
};
