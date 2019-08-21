// tslint:disable no-implicit-dependencies
// @ts-ignore
import {
  AggregationType,
  Config,
  globalStats,
  Measure,
  MeasureUnit,
  NoopExporter,
  Span,
  SpanKind,
  TagMap,
} from '@opencensus/core';
import { JaegerTraceExporter, JaegerTraceExporterOptions } from '@opencensus/exporter-jaeger';
import { PrometheusExporterOptions, PrometheusStatsExporter } from '@opencensus/exporter-prometheus';
import { TracingBase } from '@opencensus/nodejs-base';
import { TraceContextFormat } from '@opencensus/propagation-tracecontext';

const tracing = TracingBase.instance;
const tracer = tracing.tracer;

const startTracing = (config: Config) => {
  tracing.start(config);

  return () => {
    if (config.exporter !== undefined) {
      tracing.unregisterExporter(config.exporter);
    }

    tracing.stop();
  };
};

const getNewPropagation = () => new TraceContextFormat();

export {
  AggregationType,
  Config as TracingConfig,
  globalStats,
  JaegerTraceExporter,
  JaegerTraceExporterOptions,
  Measure,
  MeasureUnit,
  NoopExporter,
  PrometheusExporterOptions,
  PrometheusStatsExporter,
  Span,
  SpanKind,
  startTracing,
  TagMap,
  getNewPropagation,
  tracer,
};
