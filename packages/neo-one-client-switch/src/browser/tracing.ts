// tslint:disable no-submodule-imports readonly-keyword readonly-array no-any no-let
import { NoopExporter } from '@opencensus/web-core/build/src/exporters/noop_exporter';
import { Config, ExporterConfig, Propagation, Span, SpanKind, TracerBase, Tracing } from '@opencensus/web-types';
import { AggregationType, Measure, MeasureUnit, Stats } from '@opencensus/web-types/build/src/stats/types';
import { TagMap } from '@opencensus/web-types/build/src/tags/tag-map';

const noOp = (..._args: readonly any[]): any => {
  //
};

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
  propagation: {
    extract: noOp,
    inject: noOp,
  } as any,
  eventListeners: [],
  start: noOp,
  stop: noOp,
  registerSpanEventListener: noOp,
  unregisterSpanEventListener: noOp,
  setCurrentRootSpan: noOp,
  onStartSpan: noOp,
  onEndSpan: noOp,
};

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

export interface PrometheusExporterOptions extends ExporterConfig {
  prefix?: string;
  port?: number;
  startServer?: boolean;
}

class PrometheusStatsExporter {
  public onRegisterView = noOp;
  public onRecord = noOp;
  public start = noOp;
  public stop = noOp;
  public stopServer = noOp;
  // tslint:disable-next-line: unnecessary-constructor
  public constructor(..._args: any[]) {
    // do nothing
  }
}

export interface JaegerTraceExporterOptions extends ExporterConfig {
  serviceName: string;
  tags?: any[];
  host?: string;
  port?: number;
  maxPacketSize?: number;
}

class JaegerTraceExporter extends NoopExporter {
  public constructor(..._args: any[]) {
    super();
  }
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
