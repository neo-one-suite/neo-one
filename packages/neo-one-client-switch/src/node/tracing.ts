// tslint:disable: no-let no-any
import type { Config, Measure, Span, Stats, StatsEventListener, TracerBase } from '@opencensus/core';
import type {  JaegerTraceExporter, JaegerTraceExporterOptions } from '@opencensus/exporter-jaeger';
import type { PrometheusExporterOptions,  PrometheusStatsExporter } from '@opencensus/exporter-prometheus';
import type { TraceContextFormat } from '@opencensus/propagation-tracecontext';

const noOp = (..._args: readonly any[]): any => {
  //
};

let tracer: TracerBase = {
  sampler: {} as any,
  logger: {} as any,
  activeTraceParams: {} as any,
  propagation: {
    extract: noOp,
    inject: noOp,
  } as any,
  eventListeners: [],
  active: false,
  start: noOp,
  stop: noOp,
  startRootSpan: <T>(_options: any, func: (root: any) => T) => {
    const span = {
      addAttribute: noOp,
      spanContext: {},
      end: noOp,
    };

    return func(span);
  },
  startChildSpan: noOp,
  registerSpanEventListener: noOp,
  unregisterSpanEventListener: noOp,
  setCurrentRootSpan: noOp,
  onStartSpan: noOp,
  onEndSpan: noOp,
};

// enums copied from types directly
enum MeasureUnit {
  UNIT = "1",
  BYTE = "by",
  KBYTE = "kb",
  SEC = "s",
  MS = "ms",
  NS = "ns",
}

enum AggregationType {
  COUNT = 0,
  SUM = 1,
  LAST_VALUE = 2,
  DISTRIBUTION = 3,
}

enum SpanKind {
  UNSPECIFIED = 0,
  SERVER = 1,
  CLIENT = 2,
}

let globalStatsCache: Omit<Stats, 'registerExporter'> & {readonly registerExporter?: (listener: StatsEventListener) => void} = {
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

let coreImportCache: Promise<typeof import('@opencensus/core')> | undefined;
const globalStats: Omit<Stats, 'registerExporter'> & {readonly registerExporter: (listener: StatsEventListener) => Promise<void>}= {
  createView: globalStatsCache.createView,
  registerView: globalStatsCache.registerView,
  createMeasureDouble: globalStatsCache.createMeasureDouble,
  createMeasureInt64: globalStatsCache.createMeasureInt64,
  record: globalStatsCache.record,
  clear: globalStatsCache.clear,
  getMetrics: globalStatsCache.getMetrics,
  registerExporter: async (listener: StatsEventListener) => {
    if (coreImportCache === undefined) {
      coreImportCache = import('@opencensus/core')
    }

    if (globalStatsCache.registerExporter === undefined) {
      const coreImport = await coreImportCache;
      globalStatsCache = coreImport.globalStats;
    }

    if (globalStatsCache.registerExporter === undefined) {
      throw new Error('For TS, should always be defined unless import fails');
    }

    globalStatsCache.registerExporter(listener);
  },
  unregisterExporter: globalStatsCache.unregisterExporter,
  withTagContext: globalStatsCache.withTagContext,
  getCurrentTagContext: globalStatsCache.getCurrentTagContext,
}



let TracingBaseCache: Promise<typeof import('@opencensus/nodejs-base')> | undefined;
const startTracing = async (config: Config) => {
  if (TracingBaseCache === undefined) {
    TracingBaseCache = import('@opencensus/nodejs-base');
  }

  const { TracingBase } = await TracingBaseCache;
  const tracing = TracingBase.instance;
  tracing.start(config);
  tracer = tracing.tracer;

  return () => {
    if (config.exporter !== undefined) {
      tracing.unregisterExporter(config.exporter);
    }

    tracing.stop();
  };
};


let TraceContextFormatCache: Promise<typeof import('@opencensus/propagation-tracecontext')> | undefined;
const getNewPropagation = async (): Promise<TraceContextFormat> => {
  if (TraceContextFormatCache === undefined) {
    TraceContextFormatCache = import('@opencensus/propagation-tracecontext');
  }
  const { TraceContextFormat: ImportedTraceContextFormat } = await TraceContextFormatCache;

  return new ImportedTraceContextFormat();
};

let JaegerTraceExporterCache: Promise<typeof import('@opencensus/exporter-jaeger')> | undefined;
const getJaegerTraceExporter = async (options: JaegerTraceExporterOptions ): Promise<JaegerTraceExporter> => {
  if (JaegerTraceExporterCache === undefined) {
    JaegerTraceExporterCache = import('@opencensus/exporter-jaeger');
  }

  const { JaegerTraceExporter: ImportedJaegerTraceExporter } = await JaegerTraceExporterCache;

  return new ImportedJaegerTraceExporter(options);
}

let PrometheusExporterCache: Promise<typeof import('@opencensus/exporter-prometheus')> | undefined;
const getPrometheusExporter = async (options: PrometheusExporterOptions ): Promise<PrometheusStatsExporter> => {
  if (PrometheusExporterCache === undefined) {
    PrometheusExporterCache = import('@opencensus/exporter-prometheus');
  }

  const { PrometheusStatsExporter: PrometheusExporter } = await PrometheusExporterCache

  return new PrometheusExporter(options);
}

const getTagMap = async () => {
  if (coreImportCache === undefined) {
    coreImportCache = import('@opencensus/core')
  };

  const { TagMap: ImportTagMap } = await coreImportCache;

  return new ImportTagMap();
}

export {
  AggregationType,
  Config as TracingConfig,
  globalStats,
  getJaegerTraceExporter,
  JaegerTraceExporterOptions,
  getPrometheusExporter,
  PrometheusExporterOptions,
  Measure,
  MeasureUnit,
  Span,
  SpanKind,
  startTracing,
  getTagMap,
  getNewPropagation,
  tracer,
};
