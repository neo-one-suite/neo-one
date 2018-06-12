import { Context } from 'koa';
import { IncomingMessage } from 'http';

import _ from 'lodash';

import {
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
  Logger,
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
  KnownLabel,
} from './types';
import { ReportHandler } from './ReportHandler';

import { convertTagLabels } from './utils';
import { createTracer } from './createTracer';

export interface FullLogLevelOption {
  log: LogLevel;
  span: LogLevel;
}

export interface TracerSpan {
  // tslint:disable-next-line
  log(data: Object): void;
  setTag(name: string, value: string | number | boolean): void;
  finish(finishTime?: number): void;
  context(): SpanContext;
}
export type TracerReference = any;
export interface TracerStartSpanOptions {
  references?: TracerReference[];
  // tslint:disable-next-line
  tags?: Object;
  startTime?: number;
}

export interface Tracer {
  startSpan(name: string, options?: TracerStartSpanOptions): TracerSpan;
  childOf(span: SpanContext | TracerSpan): TracerReference;
  followsFrom(span: SpanContext | TracerSpan): TracerReference;
  extract(format: Format, carrier: Carrier): SpanContext | null;
  inject(context: SpanContext, format: Format, carrier: Carrier): void;
  close(callback: () => void): void;
}

export type Now = () => number;

export interface SpanData {
  metric?: {
    total: Histogram | Summary;
    error: Counter;
  };
  time: number;
  span?: TracerSpan;
  parent?: MonitorBase;
}

export interface MonitorBaseOptions {
  service: string;
  component: string;
  labels?: Labels;
  data?: Labels;
  logger: Logger;
  tracer?: Tracer;
  now: Now;
  spanLogLevel?: LogLevel;
  span?: SpanData | void;
  reportHandler?: ReportHandler;
}

enum LogLevelToLevel {
  error = 0,
  warn = 1,
  info = 2,
  verbose = 3,
  debug = 4,
  silly = 5,
}

type ReferenceType = 'childOf' | 'followsFrom';

abstract class DefaultReference {
  protected abstract type: ReferenceType;
  private span: SpanContext | MonitorBase;

  constructor(span: SpanContext | MonitorBase) {
    this.span = span;
  }

  public isValid(): boolean {
    // eslint-disable-next-line
    return !(this.span instanceof MonitorBase) || this.span.hasSpan();
  }

  public getTracerReference(tracer: Tracer): TracerReference | null {
    if (!this.isValid()) {
      throw new Error('Programming error');
    }

    const context =
      this.span instanceof MonitorBase ? this.span.getSpan().span : this.span;

    if (context == null) {
      return null;
    }

    return this.type === 'childOf'
      ? tracer.childOf(context)
      : tracer.followsFrom(context);
  }
}

class ChildOfReference extends DefaultReference {
  protected type: ReferenceType = 'childOf';
}

class FollowsFromReference extends DefaultReference {
  protected type: ReferenceType = 'followsFrom';
}

interface CommonLogOptions {
  name: string;
  message?: string;
  level?: LogLevel;

  metric?: Counter;

  error?: {
    metric?: Counter;
    error?: Error | null;
    message?: string;
    level?: LogLevel;
  };
}

export class MonitorBase implements Span {
  public readonly labels = KnownLabel;
  public readonly formats = Format;
  public readonly now: Now;
  private readonly service: string;
  private readonly component: string;
  private currentLabels: Labels;
  private data: Labels;
  private readonly logger: Logger;
  private readonly spanLogLevel: LogLevel;
  private readonly tracer: Tracer;
  private readonly span: SpanData | void;
  private readonly reportHandler: ReportHandler;

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
    this.service = service;
    this.component = component;
    this.currentLabels = labels || {};
    this.data = data || {};
    this.logger = logger;
    this.spanLogLevel = spanLogLevel == null ? 'info' : spanLogLevel;
    this.tracer = tracer || createTracer();
    this.now = now;
    this.span = span;
    this.reportHandler = reportHandler || new ReportHandler(logger);
  }

  public nowSeconds(): number {
    return this.now() / 1000;
  }

  public at(component: string): Monitor {
    return this.clone({ component });
  }

  public withLabels(labels: Labels): Monitor {
    return this.clone({ mergeLabels: labels });
  }

  public withData(data: Labels): Monitor {
    return this.clone({ mergeData: data });
  }

  public forContext(ctx: Context): Monitor {
    return this;
  }

  public forMessage(ctx: IncomingMessage): Monitor {
    return this;
  }

  public log({ name, message, level, metric, error }: LogOptions): void {
    this.commonLog({ name, message, level, metric, error });
  }

  public captureLog(
    func: (monitor: CaptureMonitor) => any,
    options: CaptureLogOptions,
    cloned?: boolean,
  ): any {
    let { error: errorObj } = options;
    if (errorObj == null) {
      errorObj = undefined;
    } else if (typeof errorObj === 'string') {
      errorObj = { metric: undefined, message: errorObj, level: 'error' };
    }
    const errorObjFinal = errorObj;
    let log = this;
    if (!cloned) {
      log = this.clone();
    }
    const doLog = (error?: Error | null) =>
      log.commonLog({
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
          .then((res: any) => {
            doLog();
            return res;
          })
          .catch((err: Error) => {
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

  public logError({
    name,
    message,
    level,
    error,
    metric,
  }: LogErrorOptions): void {
    let errorLevel = level;
    if (errorLevel == null) {
      errorLevel = 'error';
    }

    this.commonLog({
      name,
      message,
      level: level == null ? 'error' : level,
      error: { metric, error, message, level: errorLevel },
    });
  }

  public startSpan({
    name,
    level,
    metric,
    references: referenceIn,
    trace,
  }: SpanOptions): MonitorBase {
    let span;
    let parent;

    const fullLevel = this.getFullLevel(level);
    const references = (referenceIn || [])
      .concat([this.childOf(this)])
      .map((reference) => {
        if (reference instanceof DefaultReference && reference.isValid()) {
          return reference.getTracerReference(this.tracer);
        }

        return null;
      })
      .filter(Boolean);
    if (
      LogLevelToLevel[fullLevel.span] <= LogLevelToLevel[this.spanLogLevel] &&
      (trace || references.length > 0)
    ) {
      span = this.tracer.startSpan(name, {
        references,
        tags: this.getSpanTags(),
      });
      parent = this;
    }

    let currentParent;
    if (this.hasSpan()) {
      ({ parent: currentParent } = this.getSpan());
    }

    return this.clone({
      span: {
        metric,
        time: this.nowSeconds(),
        span,
        parent: parent == null ? currentParent : parent,
      },
    });
  }

  public end(error?: boolean): void {
    const span = this.getSpan();
    const { metric } = span;
    if (metric != null) {
      const value = this.nowSeconds() - span.time;
      this.invokeMetric(
        metric.total,
        (total) => total.observe(value),
        (total, labels) => total.observe(labels, value),
      );
      if (error) {
        this.invokeMetric(
          metric.error,
          (errorMetric) => errorMetric.inc(),
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

  public captureSpan(
    func: (span: MonitorBase) => any,
    options: CaptureSpanOptions,
  ): any {
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
          .then((res: any) => {
            span.end();
            return res;
          })
          .catch((err: Error) => {
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

  public captureSpanLog(
    func: (span: CaptureMonitor) => any,
    options: CaptureSpanLogOptions,
  ): any {
    const level = this.getFullLevel(options.level);
    return this.captureSpan(
      (span) =>
        span.captureLog(
          (log) => func(log),
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

  public childOf(span: SpanContext | Monitor | void): any {
    if (span == null) {
      return undefined;
    }
    return new ChildOfReference(span as any) as any;
  }

  public followsFrom(span: SpanContext | Monitor | void): any {
    if (span == null) {
      return undefined;
    }
    return new FollowsFromReference(span as any) as any;
  }

  public extract(format: Format, carrier: Carrier): SpanContext | null {
    return this.tracer.extract(format, carrier);
  }

  public inject(format: Format, carrier: Carrier): void {
    const span = this.span;
    if (span != null && span.span != null) {
      this.tracer.inject(span.span.context(), format, carrier);
    }
  }

  public report(report: Report): void {
    this.reportHandler.report(report);
  }

  public serveMetrics(port: number): void {
    // do nothing
  }

  public close(callback: () => void): void {
    this.closeInternal()
      .then(() => {
        callback();
      })
      .catch(() => {
        callback();
      });
  }

  public setLabels(labels: Labels): void {
    this.setSpanLabels(labels);
    this.currentLabels = { ...this.currentLabels, ...labels };
  }

  public setData(data: Labels): void {
    this.setSpanLabels(data);
    this.data = { ...this.data, ...data };
  }

  public hasSpan(): boolean {
    return this.span != null;
  }

  public getSpan(): SpanData {
    const span = this.span;
    if (span == null) {
      throw new Error('Programming error: Called end on a regular Monitor.');
    }

    return span;
  }

  protected async closeInternal(): Promise<void> {
    await Promise.all([
      new Promise((resolve) => {
        this.logger.close(() => resolve());
      }),
      new Promise((resolve) => {
        this.tracer.close(() => resolve());
      }),
    ]);
  }

  private invokeMetric<T extends Metric>(
    metric: T,
    withoutLabels: (metric: T) => void,
    withLabels: (metric: T, labels: Labels) => void,
  ): void {
    const labelNames = metric.getLabelNames();
    if (labelNames.length === 0) {
      withoutLabels(metric);
    } else {
      const labels: Labels = {};
      for (const labelName of metric.getLabelNames()) {
        labels[labelName] = this.currentLabels[labelName];
      }

      withLabels(metric, labels);
    }
  }

  private commonLog({
    name,
    message: messageIn,

    level,
    metric,

    error,
  }: CommonLogOptions): void {
    const incrementMetric = (maybeMetric?: Counter) => {
      if (maybeMetric != null) {
        this.invokeMetric(
          maybeMetric,
          (theMetric) => theMetric.inc(),
          (theMetric, metricLabels) => theMetric.inc(metricLabels),
        );
      }
    };

    let labels = {};
    let message = messageIn;
    const fullLevel = this.getFullLevel(level);
    let logLevel = fullLevel.log;
    incrementMetric(metric);
    if (error != null) {
      const { error: errorObj } = error;
      labels = {
        ...labels,
        [KnownLabel.ERROR]: errorObj != null,
        [KnownLabel.ERROR_KIND]: this.getErrorKind(errorObj),
      };
      const errorLevel = error.level == null ? 'error' : error.level;
      if (errorObj != null) {
        incrementMetric(error.metric);
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
    this.logger.log({
      name,
      level: logLevel,
      message,
      labels: convertTagLabels(this.getAllRawLabels(labels)),
      data: convertTagLabels(this.getAllRawData()),
      error: error == null ? undefined : error.error,
    });

    if (this.span != null) {
      const { span: tracerSpan } = this.span;
      if (
        LogLevelToLevel[fullLevel.span] <= LogLevelToLevel[this.spanLogLevel] &&
        tracerSpan != null
      ) {
        const spanLog: { [key: string]: any } = {
          event: name,
          message,
          ...this.getSpanTags(labels),
        };
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
  }

  private getErrorKind(error?: Error | null): string {
    if (error == null) {
      return 'n/a';
    }

    return (error as any).code == null
      ? error.constructor.name
      : (error as any).code;
  }

  private getSpanTags(labels?: Labels): Labels {
    let spanLabels = this.getAllRawLabels();
    let spanData = this.getAllRawData();
    if (this.hasSpan()) {
      const { parent } = this.getSpan();
      if (parent != null) {
        const parentLabels = new Set(Object.keys(parent.labels));
        spanLabels = _.omitBy(spanLabels, (value, label) =>
          parentLabels.has(label),
        );
        const parentData = new Set(Object.keys(parent.data));
        spanData = _.omitBy(spanData, (value, label) => parentData.has(label));
      }
    }

    return convertTagLabels({
      ...spanLabels,
      ...spanData,
      ...(labels || {}),
    });
  }

  private getAllRawLabels(labels?: Labels): Labels {
    if (labels == null) {
      return this.currentLabels;
    }

    return {
      ...this.currentLabels,
      ...labels,
      [this.labels.SERVICE]: this.service,
      [this.labels.COMPONENT]: this.component,
    };
  }

  private getAllRawData(labels?: Labels): Labels {
    if (labels == null) {
      return this.data;
    }

    return { ...this.data, ...labels };
  }

  private setSpanLabels(labels: Labels): void {
    if (this.span != null) {
      const { span: tracerSpan } = this.span;
      if (tracerSpan != null) {
        const tagLabels = convertTagLabels(labels);
        for (const key of Object.keys(tagLabels)) {
          const value = tagLabels[key];
          if (value != null) {
            tracerSpan.setTag(key, value);
          }
        }
      }
    }
  }

  private getFullLevel(levelIn?: LogLevelOption): FullLogLevelOption {
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

  private clone(
    options: {
      component?: string;
      mergeLabels?: Labels;
      mergeData?: Labels;
      span?: SpanData;
    } = {},
  ): this {
    const { component, mergeLabels, mergeData, span } = options;
    let mergedLabels = this.currentLabels;
    if (mergeLabels != null) {
      mergedLabels = { ...this.currentLabels, ...mergeLabels };
    }

    let mergedData = this.data;
    if (mergeData != null) {
      mergedData = { ...this.data, ...mergeData };
    }

    // @ts-ignore
    return new this.constructor({
      service: this.service,
      component: component == null ? this.component : component,
      logger: this.logger,
      tracer: this.tracer,
      now: this.now,
      labels: mergedLabels,
      data: mergedData,
      span: span == null ? this.span : span,
      spanLogLevel: this.spanLogLevel,
      reportHandler: this.reportHandler,
    });
  }
}
