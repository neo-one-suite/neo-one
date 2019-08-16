// tslint:disable no-submodule-imports readonly-keyword readonly-array
import { tracing } from '@opencensus/web-core';
import { NoopExporter } from '@opencensus/web-core/build/src/exporters/noop_exporter';
import { TraceContextFormat } from '@opencensus/web-propagation-tracecontext';
import { Config, ExporterConfig, Span, SpanKind } from '@opencensus/web-types';
import { AggregationType, Measure, MeasureUnit, Stats } from '@opencensus/web-types/build/src/stats/types';
import { TagMap } from '@opencensus/web-types/build/src/tags/tag-map';

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

export interface PrometheusExporterOptions extends ExporterConfig {
  /** App prefix for metrics, if needed - default opencensus */
  prefix?: string;
  /**
   * Port number for Prometheus exporter server
   * Default registered port is 9464:
   * https://github.com/prometheus/prometheus/wiki/Default-port-allocations
   */
  port?: number;
  /**
   * Define if the Prometheus exporter server will be started - default false
   */
  startServer?: boolean;
}

const JaegerTraceExporter = NoopExporter;

export interface JaegerTraceExporterOptions extends ExporterConfig {
  serviceName: string;
  // tslint:disable-next-line no-any
  tags?: any[];
  host?: string;
  port?: number;
  maxPacketSize?: number;
}

export {
  AggregationType,
  Config as TracingConfig,
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
