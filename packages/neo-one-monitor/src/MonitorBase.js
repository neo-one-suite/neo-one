/* @flow */
import type { Context } from 'koa';

import _ from 'lodash';

import type {
  Counter,
  Histogram,
  Summary,
  Carrier,
  CaptureLogOptions,
  CaptureMonitor,
  CaptureSpanOptions,
  CaptureSpanLogOptions,
  Format,
  Labels,
  LogErrorOptions,
  LogLevelOption,
  LogLevel,
  LogOptions,
  Metric,
  Monitor,
  Report,
  Span,
  SpanContext,
  SpanOptions,
} from './types';
import ReportHandler from './ReportHandler';

import { convertTagLabels } from './utils';
import createTracer from './createTracer';

export type LoggerLogOptions = {|
  name: string,
  level: LogLevel,
  message?: string,
  labels?: Labels,
  data?: Labels,
  error?: ?Error,
|};

export type FullLogLevelOption = {|
  log: LogLevel,
  span: LogLevel,
|};

export interface Logger {
  log(options: LoggerLogOptions): void;
  close(callback: () => void): void;
}

export interface TracerSpan {
  log(data: Object): void;
  setTag(name: string, value: string | number | boolean): void;
  finish(finishTime?: number): void;
  context(): SpanContext;
}
export type TracerReference = any;
export type TracerStartSpanOptions = {|
  references?: Array<TracerReference>,
  tags?: Object,
  startTime?: number,
|};

export interface Tracer {
  startSpan(name: string, options?: TracerStartSpanOptions): TracerSpan;
  childOf(span: SpanContext | TracerSpan): TracerReference;
  followsFrom(span: SpanContext | TracerSpan): TracerReference;
  extract(format: Format, carrier: Carrier): SpanContext;
  inject(context: SpanContext, format: Format, carrier: Carrier): void;
  close(callback: () => void): void;
}

export type Now = () => number;

type SpanData = {|
  metric?: {|
    total: Histogram | Summary,
    error: Counter,
  |},
  time: number,
  span?: TracerSpan,
  // eslint-disable-next-line
  parent?: MonitorBase,
|};

type MonitorBaseOptions = {|
  service: string,
  component: string,
  labels?: Labels,
  data?: Labels,
  logger: Logger,
  tracer?: Tracer,
  now: Now,
  spanLogLevel?: LogLevel,
  span?: SpanData,
  reportHandler?: ReportHandler,
|};

export const LABELS = {
  // These are added automatically
  SERVICE: 'service',
  COMPONENT: 'component',

  DB_INSTANCE: 'db.instance',
  DB_STATEMENT: 'db.statement',
  DB_TYPE: 'db.type',
  DB_USER: 'db.user',
  ERROR: 'error',
  ERROR_KIND: 'error.kind',
  ERROR_OBJECT: 'error.object',
  ERROR_STACK: 'stack',
  HTTP_METHOD: 'http.method',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_URL: 'http.url',
  MESSAGE_BUS_DESTINATION: 'message_bus.destination',
  PEER_ADDRESS: 'peer.address',
  PEER_HOSTNAME: 'peer.hostname',
  PEER_IPV4: 'peer.ipv4',
  PEER_IPV6: 'peer.ipv6',
  PEER_PORT: 'peer.port',
  PEER_SERVICE: 'peer.service',
  SAMPLING_PRIORITY: 'sampling.priority',
  SPAN_KIND: 'span.kind',

  DB_STATEMENT_SUMMARY: 'db.statement_summary',
  HTTP_PATH: 'http.path',
  HTTP_FULLPATH: 'http.full_path',
  HTTP_USER_AGENT: 'http.user_agent',
  HTTP_REQUEST_SIZE: 'http.request.size',
  HTTP_HEADERS: 'http.headers',
  HTTP_REQUEST_PROTOCOL: 'http.request.protocol',
  HTTP_REQUEST_QUERY: 'http.request.query',
  RPC_METHOD: 'rpc.method',
  RPC_TYPE: 'rpc.type',
};

const FORMATS = {
  HTTP: 'http_headers',
  TEXT: 'text_map',
  BINARY: 'binary',
};

const LOG_LEVEL_TO_LEVEL = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5,
};

type ReferenceType = 'childOf' | 'followsFrom';

class DefaultReference {
  _type: ReferenceType;
  _span: SpanContext | MonitorBase;

  constructor(span: SpanContext | $FlowFixMe) {
    this._span = span;
  }

  isValid(): boolean {
    // eslint-disable-next-line
    return !(this._span instanceof MonitorBase) || this._span.hasSpan();
  }

  getTracerReference(tracer: Tracer): ?TracerReference {
    if (!this.isValid()) {
      throw new Error('Programming error');
    }

    let context = this._span;
    // eslint-disable-next-line
    if (context instanceof MonitorBase) {
      context = context.getSpan().span;
    }

    if (context == null) {
      return null;
    }

    return this._type === 'childOf'
      ? tracer.childOf(context)
      : tracer.followsFrom(context);
  }
}

class ChildOfReference extends DefaultReference {
  _type = 'childOf';
}

class FollowsFromReference extends DefaultReference {
  _type = 'followsFrom';
}

type CommonLogOptions = {|
  name: string,
  message?: string,
  level?: LogLevel,

  metric?: Counter,

  error?: {
    metric?: Counter,
    error?: ?Error,
    message?: string,
    level?: LogLevel,
  },
|};

export default class MonitorBase implements Span {
  labels = LABELS;
  formats = FORMATS;
  _service: string;
  _component: string;
  _labels: Labels;
  _data: Labels;
  _logger: Logger;
  _spanLogLevel: LogLevel;
  _tracer: Tracer;
  now: Now;
  _span: SpanData | void;
  _reportHandler: ReportHandler;

  constructor({
    service,
    component,
    labels,
    data,
    logger,
    spanLogLevel,
    tracer,
    now,
    span,
    reportHandler,
  }: MonitorBaseOptions) {
    this._service = service;
    this._component = component;
    this._labels = labels || {};
    this._data = data || {};
    this._logger = logger;
    this._spanLogLevel = spanLogLevel == null ? 'info' : spanLogLevel;
    this._tracer = tracer || createTracer();
    this.now = now;
    this._span = span;
    this._reportHandler = reportHandler || new ReportHandler(logger);
  }

  nowSeconds(): number {
    return this.now() / 1000;
  }

  at(component: string): Monitor {
    return this._clone({ component });
  }

  withLabels(labels: Labels): Monitor {
    return this._clone({ mergeLabels: labels });
  }

  withData(data: Labels): Monitor {
    return this._clone({ mergeData: data });
  }

  // eslint-disable-next-line
  forContext(ctx: Context): Monitor {
    return this;
  }

  // eslint-disable-next-line
  forMessage(ctx: http$IncomingMessage): Monitor {
    return this;
  }

  log({ name, message, level, metric, error }: LogOptions): void {
    this._commonLog({ name, message, level, metric, error });
  }

  captureLog(
    func: (monitor: CaptureMonitor) => $FlowFixMe,
    options: CaptureLogOptions,
    cloned?: boolean,
  ): $FlowFixMe {
    let { error: errorObj } = options;
    if (errorObj == null) {
      errorObj = undefined;
    } else if (typeof errorObj === 'string') {
      errorObj = { metric: undefined, message: errorObj, level: 'error' };
    }
    const errorObjFinal = errorObj;
    let log = this;
    if (!cloned) {
      log = this._clone();
    }
    const doLog = (error?: ?Error) =>
      log._commonLog({
        name: options.name,
        message: options.message,
        level: options.level,
        metric: options.metric,
        error:
          errorObjFinal == null
            ? undefined
            : {
                metric: errorObjFinal.metric,
                message: errorObjFinal.message,
                error,
                level: errorObjFinal.level,
              },
      });

    try {
      const result = func(log);

      if (result != null && result.then != null) {
        return result
          .then(res => {
            doLog();
            return res;
          })
          .catch(err => {
            doLog(err);
            throw err;
          });
      }

      doLog();
      return result;
    } catch (error) {
      doLog(error);
      throw error;
    }
  }

  logError({ name, message, level, error, metric }: LogErrorOptions): void {
    let errorLevel = level;
    if (errorLevel == null) {
      errorLevel = 'error';
    } else if (typeof errorLevel === 'object') {
      errorLevel = errorLevel.log;
    }
    this._commonLog({
      name,
      message,
      level: level == null ? 'error' : level,
      error: { metric, error, message, level: errorLevel },
    });
  }

  startSpan({
    name,
    level,
    metric,
    references: referenceIn,
    trace,
  }: SpanOptions): MonitorBase {
    let span;
    let parent;

    const fullLevel = this._getFullLevel(level);
    const references = (referenceIn || [])
      .concat([this.childOf(this)])
      .map(reference => {
        if (reference instanceof DefaultReference && reference.isValid()) {
          return reference.getTracerReference(this._tracer);
        }

        return null;
      })
      .filter(Boolean);
    if (
      LOG_LEVEL_TO_LEVEL[fullLevel.span] <=
        LOG_LEVEL_TO_LEVEL[this._spanLogLevel] &&
      (trace || references.length > 0)
    ) {
      span = this._tracer.startSpan(name, {
        references,
        tags: this._getSpanTags(),
      });
      parent = this;
    }

    let currentParent;
    if (this.hasSpan()) {
      ({ parent: currentParent } = this.getSpan());
    }

    return this._clone({
      span: {
        metric,
        time: this.nowSeconds(),
        span,
        parent: parent == null ? currentParent : parent,
      },
    });
  }

  end(error?: boolean): void {
    const span = this.getSpan();
    const { metric } = span;
    if (metric != null) {
      const value = this.nowSeconds() - span.time;
      this._invokeMetric(
        metric.total,
        total => total.observe(value),
        (total, labels) => total.observe(labels, value),
      );
      if (error) {
        this._invokeMetric(
          metric.error,
          errorMetric => errorMetric.inc(),
          (errorMetric, labels) => errorMetric.inc(labels),
        );
      }
    }

    const { span: tracerSpan } = span;
    if (tracerSpan != null) {
      tracerSpan.setTag(this.labels.ERROR, !!error);
      tracerSpan.finish();
    }
  }

  _invokeMetric<T: Metric>(
    metric: T,
    withoutLabels: (metric: T) => void,
    withLabels: (metric: T, labels: Labels) => void,
  ): void {
    const labelNames = metric.getLabelNames();
    if (labelNames.length === 0) {
      withoutLabels(metric);
    } else {
      const labels = {};
      for (const labelName of metric.getLabelNames()) {
        labels[labelName] = this._labels[labelName];
      }

      withLabels(metric, labels);
    }
  }

  captureSpan(
    func: (span: MonitorBase) => $FlowFixMe,
    options: CaptureSpanOptions,
  ): $FlowFixMe {
    const span = this.startSpan({
      name: options.name,
      level: options.level,
      metric: options.metric,
      references: options.references,
      trace: options.trace,
    });
    try {
      const result = func(span);

      if (result != null && result.then != null) {
        return result
          .then(res => {
            span.end();
            return res;
          })
          .catch(err => {
            span.end(true);
            throw err;
          });
      }

      span.end();
      return result;
    } catch (error) {
      span.end(true);
      throw error;
    }
  }

  captureSpanLog(
    func: (span: CaptureMonitor) => $FlowFixMe,
    options: CaptureSpanLogOptions,
  ): $FlowFixMe {
    const level = this._getFullLevel(options.level);
    return this.captureSpan(
      span =>
        span.captureLog(
          log => func(log),
          {
            name: options.name,
            level: level.log,
            message: options.message,
            error:
              typeof options.error === 'object'
                ? {
                    level: options.error.level,
                    message: options.error.message,
                  }
                : options.error,
          },
          true,
        ),
      {
        name: options.name,
        level: level.span,
        metric: options.metric,
        references: options.references,
        trace: options.trace,
      },
    );
  }

  childOf(span: SpanContext | Monitor | void): $FlowFixMe {
    if (span == null) {
      return undefined;
    }
    return (new ChildOfReference((span: $FlowFixMe)): $FlowFixMe);
  }

  followsFrom(span: SpanContext | Monitor | void): $FlowFixMe {
    if (span == null) {
      return undefined;
    }
    return (new FollowsFromReference((span: $FlowFixMe)): $FlowFixMe);
  }

  extract(format: Format, carrier: Carrier): SpanContext | void {
    return this._tracer.extract(format, carrier);
  }

  inject(format: Format, carrier: Carrier): void {
    const span = this._span;
    if (span != null && span.span != null) {
      this._tracer.inject(span.span.context(), format, carrier);
    }
  }

  report(report: Report): void {
    this._reportHandler.report(report);
  }

  // eslint-disable-next-line
  serveMetrics(port: number): void {}

  close(callback: () => void): void {
    this._closeInternal()
      .then(() => {
        callback();
      })
      .catch(() => {
        callback();
      });
  }

  setLabels(labels: Labels): void {
    this._setSpanLabels(labels);
    this._labels = { ...this._labels, ...labels };
  }

  setData(data: Labels): void {
    this._setSpanLabels(data);
    this._data = { ...this._data, ...data };
  }

  hasSpan(): boolean {
    return this._span != null;
  }

  getSpan(): SpanData {
    const span = this._span;
    if (span == null) {
      throw new Error('Programming error: Called end on a regular Monitor.');
    }

    return span;
  }

  _commonLog({
    name,
    message: messageIn,

    level,
    metric,

    error,
  }: CommonLogOptions): void {
    const incrementMetric = (maybeMetric?: Counter) => {
      if (maybeMetric != null) {
        this._invokeMetric(
          maybeMetric,
          theMetric => theMetric.inc(),
          (theMetric, labels) => theMetric.inc(labels),
        );
      }
    };

    let labels = {};
    let message = messageIn;
    const fullLevel = this._getFullLevel(level);
    let logLevel = fullLevel.log;
    incrementMetric(metric);
    if (error != null) {
      incrementMetric(error.metric);

      labels = { ...labels };
      labels[LABELS.ERROR] = error.error != null;
      labels[LABELS.ERROR_KIND] = this._getErrorKind(error.error);
      const errorLevel = error.level == null ? 'error' : error.level;
      const { error: errorObj } = error;
      if (errorObj != null) {
        logLevel = errorLevel;
        const { message: errorMessage } = error;
        if (errorMessage == null) {
          message = errorMessage;
        } else {
          const dot = errorMessage.endsWith('.') ? '' : '.';
          message = `${errorMessage}${dot} ${errorObj.message}`;
        }
      }
    }

    // Gather up all information for logging
    this._logger.log({
      name,
      level: logLevel,
      message,
      labels: convertTagLabels(this._getAllRawLabels(labels)),
      data: convertTagLabels(this._getAllRawData()),
      error: error == null ? undefined : error.error,
    });

    const { span: tracerSpan } = this._span || {};
    if (
      LOG_LEVEL_TO_LEVEL[fullLevel.span] <=
        LOG_LEVEL_TO_LEVEL[this._spanLogLevel] &&
      tracerSpan != null
    ) {
      const spanLog = ({
        event: name,
        message,
        ...this._getSpanTags(labels),
      }: Object);
      if (error != null) {
        const { error: errorObj } = error;
        if (errorObj != null) {
          spanLog[this.labels.ERROR_OBJECT] = errorObj;
          spanLog[this.labels.ERROR_STACK] = errorObj.stack;
        }
      }
      // Only log information from the current point in time
      tracerSpan.log(spanLog);
    }
  }

  _getErrorKind(error?: ?Error): string {
    if (error == null) {
      return 'n/a';
    }

    return (error: $FlowFixMe).code == null
      ? error.constructor.name
      : (error: $FlowFixMe).code;
  }

  _getSpanTags(labels?: Labels): Labels {
    let spanLabels = this._getAllRawLabels();
    let spanData = this._getAllRawData();
    if (this.hasSpan()) {
      const { parent } = this.getSpan();
      if (parent != null) {
        const parentLabels = new Set(Object.keys(parent._labels));
        spanLabels = _.omitBy(spanLabels, label => parentLabels.has(label));
        const parentData = new Set(Object.keys(parent._data));
        spanData = _.omitBy(spanData, label => parentData.has(label));
      }
    }

    return convertTagLabels({
      ...spanLabels,
      ...spanData,
      ...(labels || {}),
    });
  }

  _getAllRawLabels(labels?: Labels): Labels {
    if (labels == null) {
      return this._labels;
    }

    return {
      ...this._labels,
      ...labels,
      [this.labels.SERVICE]: this._service,
      [this.labels.COMPONENT]: this._component,
    };
  }

  _getAllRawData(labels?: Labels): Labels {
    if (labels == null) {
      return this._data;
    }

    return { ...this._data, ...labels };
  }

  _setSpanLabels(labels: Labels): void {
    const span = this._span || {};
    const { span: tracerSpan } = span;
    if (tracerSpan != null) {
      const tagLabels = convertTagLabels(labels);
      for (const key of Object.keys(tagLabels)) {
        if (tagLabels[key] != null) {
          tracerSpan.setTag(key, tagLabels[key]);
        }
      }
    }
  }

  _getFullLevel(levelIn?: LogLevelOption): FullLogLevelOption {
    let level = levelIn;
    if (level == null) {
      level = 'info';
    }

    if (typeof level === 'string') {
      return {
        log: level,
        span: level,
      };
    }

    return {
      log: level.log,
      span: level.span == null ? level.log : level.span,
    };
  }

  _clone(options?: {|
    component?: string,
    mergeLabels?: Labels,
    mergeData?: Labels,
    span?: SpanData,
  |}) {
    const { component, mergeLabels, mergeData, span } = options || {};
    let mergedLabels = this._labels;
    if (mergeLabels != null) {
      mergedLabels = { ...this._labels, ...mergeLabels };
    }

    let mergedData = this._data;
    if (mergeData != null) {
      mergedData = { ...this._data, ...mergeData };
    }

    return new this.constructor({
      service: this._service,
      component: component == null ? this._component : component,
      logger: this._logger,
      tracer: this._tracer,
      now: this.now,
      labels: mergedLabels,
      data: mergedData,
      span: span == null ? this._span : span,
      spanLogLevel: this._spanLogLevel,
      reportHandler: this._reportHandler,
    });
  }

  async _closeInternal(): Promise<void> {
    await Promise.all([
      new Promise(resolve => {
        this._logger.close(() => resolve());
      }),
      new Promise(resolve => {
        this._tracer.close(() => resolve());
      }),
    ]);
  }
}
