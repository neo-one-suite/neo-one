import { IncomingMessage } from 'http';
import { Context } from 'koa';

import { utils } from '@neo-one/utils';
import _ from 'lodash';

import { ReportHandler } from './ReportHandler';
import {
  CaptureLogOptions,
  CaptureMonitor,
  CaptureSpanLogOptions,
  CaptureSpanOptions,
  Carrier,
  Counter,
  Format,
  Histogram,
  KnownLabel,
  Labels,
  LogErrorOptions,
  Logger,
  LogLevel,
  LogLevelOption,
  LogOptions,
  Metric,
  Monitor,
  Report,
  Span,
  SpanContext,
  SpanOptions,
  Summary,
} from './types';

import { createTracer } from './createTracer';
import { convertTagLabels } from './utils';

export interface FullLogLevelOption {
  readonly log: LogLevel;
  readonly span: LogLevel;
}

export interface TracerSpan {
  readonly log: (data: object) => void;
  readonly setTag: (name: string, value: string | number | boolean) => void;
  readonly finish: (finishTime?: number) => void;
  readonly context: () => SpanContext;
}
export interface TracerReference {
  readonly __tracer: undefined;
}
export interface TracerStartSpanOptions {
  readonly references?: ReadonlyArray<TracerReference>;
  readonly tags?: object;
  readonly startTime?: number;
}

export interface Tracer {
  readonly startSpan: (name: string, options?: TracerStartSpanOptions) => TracerSpan;
  readonly childOf: (span: SpanContext | TracerSpan) => TracerReference;
  readonly followsFrom: (span: SpanContext | TracerSpan) => TracerReference;
  readonly extract: (format: Format, carrier: Carrier) => SpanContext | undefined;
  readonly inject: (context: SpanContext, format: Format, carrier: Carrier) => void;
  readonly close: (callback: () => void) => void;
}

export type Now = () => number;

export interface SpanData {
  readonly metric?: {
    readonly total: Histogram | Summary;
    readonly error: Counter;
  };
  readonly time: number;
  readonly span?: TracerSpan;
  readonly parent?: MonitorBase;
}

export interface MonitorBaseOptions {
  readonly service: string;
  readonly component: string;
  readonly labels?: Labels;
  readonly data?: Labels;
  readonly logger: Logger;
  readonly tracer?: Tracer;
  readonly now: Now;
  readonly spanLogLevel?: LogLevel;
  readonly span?: SpanData | void;
  readonly reportHandler?: ReportHandler;
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
  protected abstract readonly type: ReferenceType;
  private readonly span: SpanContext | MonitorBase;

  public constructor(span: SpanContext | MonitorBase) {
    this.span = span;
  }

  public isValid(): boolean {
    // tslint:disable-next-line no-use-before-declare
    return !(this.span instanceof MonitorBase) || this.span.hasSpan();
  }

  public getTracerReference(tracer: Tracer): TracerReference | undefined {
    if (!this.isValid()) {
      throw new Error('Programming error');
    }

    // tslint:disable-next-line no-use-before-declare
    const context = this.span instanceof MonitorBase ? this.span.getSpan().span : this.span;

    if (context === undefined) {
      return undefined;
    }

    return this.type === 'childOf' ? tracer.childOf(context) : tracer.followsFrom(context);
  }
}

class ChildOfReference extends DefaultReference {
  protected readonly type: ReferenceType = 'childOf';
}

class FollowsFromReference extends DefaultReference {
  protected readonly type: ReferenceType = 'followsFrom';
}

interface CommonLogOptions {
  readonly name: string;
  readonly message?: string;
  readonly level?: LogLevel;

  readonly metric?: Counter;

  readonly error?: {
    readonly metric?: Counter;
    readonly error?: Error | undefined;
    readonly message?: string;
    readonly level?: LogLevel;
  };
}

export class MonitorBase implements Span {
  public readonly labels = KnownLabel;
  public readonly formats = Format;
  public readonly now: Now;
  private readonly service: string;
  private readonly component: string;
  private mutableCurrentLabels: Labels;
  private mutableData: Labels;
  private readonly logger: Logger;
  private readonly spanLogLevel: LogLevel;
  private readonly tracer: Tracer;
  private readonly span: SpanData | void;
  private readonly reportHandler: ReportHandler;

  public constructor({
    service,
    component,
    labels = {},
    data = {},
    logger,
    spanLogLevel = 'info',
    tracer = createTracer(),
    now,
    span,
    reportHandler = new ReportHandler(logger),
  }: MonitorBaseOptions) {
    this.service = service;
    this.component = component;
    this.mutableCurrentLabels = labels;
    this.mutableData = data;
    this.logger = logger;
    this.spanLogLevel = spanLogLevel;
    this.tracer = tracer;
    this.now = now;
    this.span = span;
    this.reportHandler = reportHandler;
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

  public forContext(_ctx: Context): Monitor {
    return this;
  }

  public forMessage(_ctx: IncomingMessage): Monitor {
    return this;
  }

  public log({ name, message, level, metric, error }: LogOptions): void {
    this.commonLog({ name, message, level, metric, error });
  }

  // tslint:disable-next-line no-any
  public captureLog(func: (monitor: CaptureMonitor) => any, options: CaptureLogOptions, cloned = false): any {
    let { error: errorObj } = options;
    if (errorObj === undefined) {
      errorObj = undefined;
    } else if (typeof errorObj === 'string') {
      errorObj = { metric: undefined, message: errorObj, level: 'error' };
    }
    const errorObjFinal = errorObj;
    const log = cloned ? this : this.clone();
    const doLog = (error?: Error | undefined) =>
      log.commonLog({
        name: options.name,
        message: options.message,
        level: options.level,
        metric: options.metric,
        error:
          errorObjFinal === undefined
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

      if (result !== undefined && result.then !== undefined) {
        return (
          result
            // tslint:disable-next-line no-any
            .then((res: any) => {
              doLog();

              return res;
            })
            .catch((err: Error) => {
              doLog(err);
              throw err;
            })
        );
      }

      doLog();

      return result;
    } catch (error) {
      doLog(error);
      throw error as Error;
    }
  }

  public logError({ name, message, level, error, metric }: LogErrorOptions): void {
    let errorLevel = level;
    if (errorLevel === undefined) {
      errorLevel = 'error';
    }

    this.commonLog({
      name,
      message,
      level: level === undefined ? 'error' : level,
      error: { metric, error, message, level: errorLevel },
    });
  }

  public startSpan({ name, level, metric, references = [], trace }: SpanOptions): MonitorBase {
    let span;
    let parent;

    const fullLevel = this.getFullLevel(level);
    const tracerReferences = references
      .concat([this.childOf(this)])
      .map((reference) => {
        if (reference instanceof DefaultReference && reference.isValid()) {
          return reference.getTracerReference(this.tracer);
        }

        return undefined;
      })
      .filter(utils.notNull);
    if (
      LogLevelToLevel[fullLevel.span] <= LogLevelToLevel[this.spanLogLevel] &&
      (trace !== undefined || tracerReferences.length > 0)
    ) {
      span = this.tracer.startSpan(name, {
        references: tracerReferences,
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
        parent: parent === undefined ? currentParent : parent,
      },
    });
  }

  public end(error = false): void {
    const span = this.getSpan();
    const { metric } = span;
    if (metric !== undefined) {
      const value = this.nowSeconds() - span.time;
      this.invokeMetric(metric.total, (total) => total.observe(value), (total, labels) => total.observe(labels, value));
      if (error) {
        this.invokeMetric(
          metric.error,
          (errorMetric) => errorMetric.inc(),
          (errorMetric, labels) => errorMetric.inc(labels),
        );
      }
    }

    const { span: tracerSpan } = span;
    if (tracerSpan !== undefined) {
      tracerSpan.setTag(this.labels.ERROR, !!error);
      tracerSpan.finish();
    }
  }

  // tslint:disable-next-line no-any
  public captureSpan(func: (span: MonitorBase) => any, options: CaptureSpanOptions): any {
    const span = this.startSpan({
      name: options.name,
      level: options.level,
      metric: options.metric,
      references: options.references,
      trace: options.trace,
    });
    try {
      const result = func(span);

      if (result !== undefined && result.then !== undefined) {
        return (
          result
            // tslint:disable-next-line no-any
            .then((res: any) => {
              span.end();

              return res;
            })
            .catch((err: Error) => {
              span.end(true);
              throw err;
            })
        );
      }

      span.end();

      return result;
    } catch (error) {
      span.end(true);
      throw error as Error;
    }
  }

  // tslint:disable-next-line no-any
  public captureSpanLog(func: (span: CaptureMonitor) => any, options: CaptureSpanLogOptions): any {
    const level = this.getFullLevel(options.level);

    return this.captureSpan(
      (span) =>
        span.captureLog(
          func,
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

  // tslint:disable-next-line no-any
  public childOf(span: SpanContext | Monitor | void): any {
    if (span === undefined) {
      return undefined;
    }

    // tslint:disable-next-line no-any
    return new ChildOfReference(span as any) as any;
  }

  // tslint:disable-next-line no-any
  public followsFrom(span: SpanContext | Monitor | void): any {
    if (span === undefined) {
      return undefined;
    }

    // tslint:disable-next-line no-any
    return new FollowsFromReference(span as any) as any;
  }

  public extract(format: Format, carrier: Carrier): SpanContext | undefined {
    return this.tracer.extract(format, carrier);
  }

  public inject(format: Format, carrier: Carrier): void {
    const span = this.span;
    if (span !== undefined && span.span !== undefined) {
      this.tracer.inject(span.span.context(), format, carrier);
    }
  }

  public report(report: Report): void {
    this.reportHandler.report(report);
  }

  public serveMetrics(_port: number): void {
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
    this.mutableCurrentLabels = { ...this.mutableCurrentLabels, ...labels };
  }

  public setData(data: Labels): void {
    this.setSpanLabels(data);
    this.mutableData = { ...this.mutableData, ...data };
  }

  public hasSpan(): boolean {
    return this.span !== undefined;
  }

  public getSpan(): SpanData {
    const span = this.span;
    if (span === undefined) {
      throw new Error('Programming error: Called end on a regular Monitor.');
    }

    return span;
  }

  protected async closeInternal(): Promise<void> {
    await Promise.all([
      new Promise<void>((resolve) => {
        this.logger.close(resolve);
      }),
      new Promise<void>((resolve) => {
        this.tracer.close(resolve);
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
      const labels = metric.getLabelNames().reduce<Labels>(
        (acc, labelName) => ({
          ...acc,
          [labelName]: this.mutableCurrentLabels[labelName],
        }),
        {},
      );

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
      if (maybeMetric !== undefined) {
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
    if (error !== undefined) {
      const { error: errorObj } = error;
      labels = {
        ...labels,
        [KnownLabel.ERROR]: errorObj !== undefined,
        [KnownLabel.ERROR_KIND]: this.getErrorKind(errorObj),
      };
      const errorLevel = error.level === undefined ? 'error' : error.level;
      if (errorObj !== undefined) {
        incrementMetric(error.metric);
        logLevel = errorLevel;
        const { message: errorMessage } = error;
        if (errorMessage === undefined) {
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
      error: error === undefined ? undefined : error.error,
    });

    if (this.span !== undefined) {
      const { span: tracerSpan } = this.span;
      if (LogLevelToLevel[fullLevel.span] <= LogLevelToLevel[this.spanLogLevel] && tracerSpan !== undefined) {
        // tslint:disable-next-line no-any
        let spanLog: { [key: string]: any } = {
          event: name,
          message,
          ...this.getSpanTags(labels),
        };
        if (error !== undefined) {
          const { error: errorObj } = error;
          if (errorObj !== undefined) {
            spanLog = {
              ...spanLog,
              [this.labels.ERROR_OBJECT]: errorObj,
              [this.labels.ERROR_STACK]: errorObj.stack,
            };
          }
        }
        // Only log information from the current point in time
        tracerSpan.log(spanLog);
      }
    }
  }

  private getErrorKind(error?: Error | undefined): string {
    if (error === undefined) {
      return 'n/a';
    }

    // tslint:disable-next-line no-any
    return (error as any).code === undefined ? error.constructor.name : (error as any).code;
  }

  private getSpanTags(labels: Labels = {}): Labels {
    let spanLabels = this.getAllRawLabels();
    let spanData = this.getAllRawData();
    if (this.hasSpan()) {
      const { parent } = this.getSpan();
      if (parent !== undefined) {
        const parentLabels = new Set(Object.keys(parent.labels));
        spanLabels = _.omitBy(spanLabels, (_value, label) => parentLabels.has(label));
        const parentData = new Set(Object.keys(parent.mutableData));
        spanData = _.omitBy(spanData, (_value, label) => parentData.has(label));
      }
    }

    return convertTagLabels({
      ...spanLabels,
      ...spanData,
      ...labels,
    });
  }

  private getAllRawLabels(labels?: Labels): Labels {
    if (labels === undefined) {
      return this.mutableCurrentLabels;
    }

    return {
      ...this.mutableCurrentLabels,
      ...labels,
      [this.labels.SERVICE]: this.service,
      [this.labels.COMPONENT]: this.component,
    };
  }

  private getAllRawData(labels?: Labels): Labels {
    if (labels === undefined) {
      return this.mutableData;
    }

    return { ...this.mutableData, ...labels };
  }

  private setSpanLabels(labels: Labels): void {
    if (this.span !== undefined) {
      const { span: tracerSpan } = this.span;
      if (tracerSpan !== undefined) {
        const tagLabels = convertTagLabels(labels);
        Object.keys(tagLabels).forEach((key) => {
          const value = tagLabels[key];
          if (value !== undefined) {
            tracerSpan.setTag(key, value);
          }
        });
      }
    }
  }

  private getFullLevel(levelIn?: LogLevelOption): FullLogLevelOption {
    let level = levelIn;
    if (level === undefined) {
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
      span: level.span === undefined ? level.log : level.span,
    };
  }

  private clone(
    options: {
      readonly component?: string;
      readonly mergeLabels?: Labels;
      readonly mergeData?: Labels;
      readonly span?: SpanData;
    } = {},
  ): this {
    const { component, mergeLabels, mergeData, span } = options;
    let mergedLabels = this.mutableCurrentLabels;
    if (mergeLabels !== undefined) {
      mergedLabels = { ...this.mutableCurrentLabels, ...mergeLabels };
    }

    let mergedData = this.mutableData;
    if (mergeData !== undefined) {
      mergedData = { ...this.mutableData, ...mergeData };
    }

    // @ts-ignore
    return new this.constructor({
      service: this.service,
      component: component === undefined ? this.component : component,
      logger: this.logger,
      tracer: this.tracer,
      now: this.now,
      labels: mergedLabels,
      data: mergedData,
      span: span === undefined ? this.span : span,
      spanLogLevel: this.spanLogLevel,
      reportHandler: this.reportHandler,
    });
  }
}
