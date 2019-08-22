// tslint:disable no-submodule-imports readonly-keyword readonly-array
import { NoopExporter } from '@opencensus/web-core/build/src/exporters/noop_exporter';
import { Config, ExporterConfig, Propagation, Span, SpanKind, TracerBase, Tracing } from '@opencensus/web-types';
import { AggregationType, Measure, MeasureUnit, Stats } from '@opencensus/web-types/build/src/stats/types';
import { TagMap } from '@opencensus/web-types/build/src/tags/tag-map';

// tslint:disable-next-line: no-any
const noOp = (..._args: readonly any[]): any => {
  //
};

// tslint:disable no-any
// tslint:disable-next-line: no-let
let tracer: TracerBase = {
  startRootSpan: <T>(_options: any, func: (root: any) => T) => {
    const span = {
      addAttribute: noOp,
      spanContext: {},
      end: noOp,
    };

    return func(span);
  },
  startChildSpan: noOp,
  sampler: {} as any,
  logger: {} as any,
  activeTraceParams: {} as any,
  active: false,
  propagation: {} as any,
  eventListeners: [],
  start: noOp,
  stop: noOp,
  registerSpanEventListener: noOp,
  unregisterSpanEventListener: noOp,
  setCurrentRootSpan: noOp,
  onStartSpan: noOp,
  onEndSpan: noOp,
};
// tslint:enable no-any

// tslint:disable-next-line: no-let
let tracingCache: Tracing | undefined;
const startTracing = async (config: Config) => {
  if (tracingCache === undefined) {
    const ocWeb = await import('@opencensus/web-core');
    tracingCache = ocWeb.tracing;
    tracer = tracingCache.tracer;
  }
  tracingCache.start(config);

  return () => {
    if (tracingCache !== undefined) {
      if (config.exporter !== undefined) {
        tracingCache.unregisterExporter(config.exporter);
      }
      tracingCache.stop();
    }
  };
};

// tslint:disable-next-line: no-let
let createTraceContextFormat: (() => Propagation) | undefined;
const getNewPropagation = async () => {
  if (createTraceContextFormat === undefined) {
    const ocTraceContext = await import('@opencensus/web-propagation-tracecontext');
    createTraceContextFormat = () => new ocTraceContext.TraceContextFormat();
  }

  return createTraceContextFormat();
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

class PrometheusStatsExporter {
  public onRegisterView = noOp;
  public onRecord = noOp;
  public start = noOp;
  public stop = noOp;
  public stopServer = noOp;
  // tslint:disable-next-line: unnecessary-constructor no-any
  public constructor(..._args: any[]) {
    // do nothing
  }
}

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

class JaegerTraceExporter extends NoopExporter {
  // tslint:disable-next-line: no-any
  public constructor(..._args: any[]) {
    super();
  }
}

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
  getNewPropagation,
  tracer,
};
