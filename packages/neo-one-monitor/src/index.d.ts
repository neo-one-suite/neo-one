import { Context } from 'koa';
import { IncomingMessage } from 'http';

export type LogField =
  // The type or "kind" of an error (only for event="error" logs).
  // E.g., "Exception", "OSError"
  | 'error.kind'
  // For languages that support such a thing (e.g., Java, Python), the actual
  // Throwable/Exception/Error object instance itself.
  // E.g., A java.lang.UnsupportedOperationException instance, a python
  // exceptions.NameError instance
  | 'error.object'
  // A stable identifier for some notable moment in the lifetime of a Span.
  // For instance, a mutex lock acquisition or release or the sorts of lifetime
  // events in a browser page load described in the Performance.timing
  // specification. E.g., from Zipkin, "cs", "sr", "ss", or "cr".
  // Or, more generally, "initialized" or "timed out". For errors, "error"
  | 'event'
  // A concise, human-readable, one-line message explaining the event.
  // E.g., "Could not connect to backend", "Cache invalidation succeeded"
  | 'message'
  // A stack trace in platform-conventional format; may or may not pertain
  // to an error.
  | 'stack';

export type Label = string;
export type LabelValue = string | number | boolean | null | undefined;
export type Labels = { [label: string]: LabelValue };

/* General guidelines -
  - 'info'
    - for production logged messages
    - for production logged spans
  - 'verbose'
    - for development logged messages (i.e. to console)
    - for production logged metrics
  - Force metrics and spans to be logged by using metricLevel and spanLevel
    respectively at verbose or higher.
*/
export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'verbose'
  | 'debug'
  | 'silly';
export type LogLevelOption =
  | LogLevel
  | {
      log: LogLevel;
      span?: LogLevel;
    };

export type KnownLabels = {
  SERVICE: 'service';
  COMPONENT: 'component';

  // Database instance name. E.g. main
  DB_INSTANCE: 'db.instance';
  // Database statement. E.g. SELECT * FROM wuser table;
  DB_STATEMENT: 'db.statement';
  // Database type. For any SQL database, "sql". For others, the lower-case
  // database category, e.g. "cassandra", "hbase", or "redis".
  DB_TYPE: 'db.type';
  // Username for accessing database. E.g., "readonly_user" or "reporting_user"
  DB_USER: 'db.user';
  // true if and only if the application considers the operation to have failed
  ERROR: 'error';
  // Error code if available or constructor name
  ERROR_KIND: 'error.kind';
  // Actual Error object
  ERROR_OBJECT: 'error.object';
  // Error stack
  ERROR_STACK: 'stack';
  // HTTP method of the request for the associated Span. E.g., "GET", "POST"
  HTTP_METHOD: 'http.method';
  // HTTP response status code for the associated Span. E.g., 200, 503, 404
  HTTP_STATUS_CODE: 'http.status_code';
  // URL of the request being handled in this segment of the trace, in standard
  // URI format. E.g., "https://domain.net/path/to?resource=here"
  HTTP_URL: 'http.url';
  // An address at which messages can be exchanged. E.g. A Kafka record has an
  // associated "topic name" that can be extracted by the instrumented producer
  // or consumer and stored using this tag.
  MESSAGE_BUS_DESTINATION: 'message_bus.destination';
  // Remote "address", suitable for use in a networking client library. This may
  // be a "ip:port", a bare "hostname", a FQDN, or even a JDBC substring like
  // "mysql://prod-db:3306"
  PEER_ADDRESS: 'peer.address';
  // Remote hostname. E.g., "opentracing.io", "internal.dns.name"
  PEER_HOSTNAME: 'peer.hostname';
  // Remote IPv4 address as a .-separated tuple. E.g., "127.0.0.1"
  PEER_IPV4: 'peer.ipv4';
  // Remote IPv6 address as a string of colon-separated 4-char hex tuples.
  // E.g., "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
  PEER_IPV6: 'peer.ipv6';
  // Remote port. E.g., 80
  PEER_PORT: 'peer.port';
  // Remote service name (for some unspecified definition of "service").
  // E.g., "elasticsearch", "a_custom_microservice", "memcache"
  PEER_SERVICE: 'peer.service';
  // If greater than 0, a hint to the Tracer to do its best to capture the
  // trace. If 0, a hint to the trace to not-capture the trace. If absent,
  // the Tracer should use its default sampling mechanism.
  SAMPLING_PRIORITY: 'sampling.priority';
  // Either "client" or "server" for the appropriate roles in an RPC, and
  // "producer" or "consumer" for the appropriate roles in a messaging scenario.
  SPAN_KIND: 'span.kind';

  // Low cardinality version of db.statement
  DB_STATEMENT_SUMMARY: 'db.statement.summary';
  // The path of the request. Must be low cardinality. E.g. /account/:id
  // not /account/123
  HTTP_PATH: 'http.path';
  // Full path of the request, high cardinality.
  HTTP_FULLPATH: 'http.full_path';
  // The user agent for the request.
  HTTP_USER_AGENT: 'http.user_agent';
  // Request length
  HTTP_REQUEST_SIZE: 'http.request.size';
  // Headers
  HTTP_HEADERS: 'http.headers';
  // Request protocol
  HTTP_REQUEST_PROTOCOL: 'http.request.protocol';
  // Request querystring
  HTTP_REQUEST_QUERY: 'http.request.query';
  // RPC method called. E.g. getblock.
  RPC_METHOD: 'rpc.method';
  // RPC type, e.g. jsonrpc.
  RPC_TYPE: 'rpc.type';
};

export type Format = 'http_headers' | 'text_map' | 'binary';
export type Formats = {
  HTTP: 'http_headers';
  TEXT: 'text_map';
  BINARY: 'binary';
};
export type Carrier = any;

export type CollectedLoggerLogOptions = {
  name: string;
  level: LogLevel;
  message?: string;
  labels?: Labels;
  data?: Labels;
  error?: {
    message?: string;
    stack?: string;
    code?: string;
  };
};

export interface MetricOptions {
  name: string;
  help?: string;
  labelNames?: Array<Label>;
  labels?: Array<Labels>;
}

export interface BucketedMetricOptions extends MetricOptions {
  buckets?: Array<number>;
}

export interface PercentiledMetricOptions extends MetricOptions {
  percentiles?: Array<number>;
}

export type AllMetricOptions =
  | MetricOptions
  | BucketedMetricOptions
  | PercentiledMetricOptions;

export type MetricValue = {
  countOrLabels?: Labels | number;
  count?: number;
};

export type CollectedMetric<T extends MetricOptions | BucketedMetricOptions> = {
  metric: T;
  values: Array<MetricValue>;
};
export type CollectedMetrics<
  T extends MetricOptions | BucketedMetricOptions
> = {
  [name: string]: CollectedMetric<T>;
};

export type MetricCollection = {
  counters: CollectedMetrics<MetricOptions>;
  histograms: CollectedMetrics<BucketedMetricOptions>;
};

export type Report = {
  logs: Array<CollectedLoggerLogOptions>;
  metrics: MetricCollection;
};

export interface Counter {
  inc(count?: number): void;
  inc(labels?: Labels, count?: number): void;

  getLabelNames(): Array<Label>;
}

export interface Gauge {
  inc(count?: number): void;
  inc(labels?: Labels, count?: number): void;
  dec(count?: number): void;
  dec(labels?: Labels, count?: number): void;
  set(value: number): void;
  set(labels: Labels, value: number): void;

  getLabelNames(): Array<Label>;
}

export interface Histogram {
  observe(value: number): void;
  observe(labels: Labels, value: number): void;

  getLabelNames(): Array<Label>;
}

export interface Summary {
  observe(value: number): void;
  observe(labels: Labels, value: number): void;

  getLabelNames(): Array<Label>;
}

export type Metric = Counter | Gauge | Histogram | Summary;

export interface MetricsFactory {
  createCounter(options: MetricOptions): Counter;
  createGauge(options: MetricOptions): Gauge;
  createHistogram(options: BucketedMetricOptions): Histogram;
  createSummary(options: PercentiledMetricOptions): Summary;

  setFactory(factory: MetricsFactory): void;
}

export type LogOptions = {
  name: string; // Lowercase. Increments a counter for the same event.
  message?: string; // Human readable string.
  level?: LogLevel;

  metric?: Counter;

  error?: {
    metric?: Counter;
    error?: Error | null;
    message?: string;
    level?: LogLevel;
  };
};

export type CaptureLogOptions = {
  name: string;
  message?: string;
  level?: LogLevel;

  metric?: Counter;

  error?:
    | string
    | {
        metric?: Counter;
        message?: string;
        level?: LogLevel;
      };
};

export type LogErrorOptions = {
  name: string;
  message?: string;
  error: Error;
  level?: LogLevel;
  metric?: Counter;
};

export type Reference = any;

export type SpanOptions = {
  name: string;
  level?: LogLevel;

  metric?: {
    total: Histogram | Summary;
    error: Counter;
  };

  references?: Array<Reference | void>;
  trace?: boolean; // Is this allowed to be a top level span?
};

export type CaptureSpanOptions = {
  name: string;
  level?: LogLevel;

  metric?: {
    total: Histogram | Summary;
    error: Counter;
  };

  references?: Array<Reference | void>;
  trace?: boolean; // Is this allowed to be a top level span?
};

export type CaptureSpanLogOptions = {
  name: string;
  message?: string;
  level?: LogLevelOption;

  metric?: {
    total: Histogram | Summary;
    error: Counter;
  };

  error?:
    | string
    | {
        message?: string;
        level?: LogLevel;
      };
  references?: Array<Reference | void>;
  trace?: boolean; // Is this allowed to be a top level span?
};

/*
Usage:
Do you want to count something? monitor.getCounter
Do you want to log a message? monitor.log
Do you want to add metadata to all subsequent monitoring? monitor.withLabels
Do you want to time something? monitor.startSpan
Did you enter a new component? monitor.at
*/
export interface Monitor {
  labels: KnownLabels;
  formats: Formats;
  at(component: string): Monitor;
  withLabels(labels: Labels): Monitor;
  withData(data: Labels): Monitor;
  forContext(ctx: Context): Monitor;
  forMessage(message: IncomingMessage): Monitor;

  log(options: LogOptions): void;
  captureLog<TResult>(
    // eslint-disable-next-line
    func: (monitor: CaptureMonitor) => TResult,
    options: CaptureLogOptions,
  ): TResult;
  captureLog<TResult>(
    // eslint-disable-next-line
    func: (monitor: CaptureMonitor) => Promise<TResult>,
    options: CaptureLogOptions,
  ): Promise<TResult>;
  logError(options: LogErrorOptions): void;

  // eslint-disable-next-line
  startSpan(options: SpanOptions): Span;
  captureSpan<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => TResult,
    options: CaptureSpanOptions,
  ): TResult;
  captureSpan<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => Promise<TResult>,
    options: CaptureSpanOptions,
  ): Promise<TResult>;
  captureSpanLog<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => TResult,
    options: CaptureSpanLogOptions,
  ): TResult;
  captureSpanLog<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => Promise<TResult>,
    options: CaptureSpanLogOptions,
  ): Promise<TResult>;

  childOf(span: SpanContext | Monitor): Reference;
  childOf(span: void): void;
  followsFrom(span: SpanContext | Monitor): Reference;
  followsFrom(span: void): void;
  extract(format: Format, carrier: Carrier): SpanContext | void;
  inject(format: Format, carrier: Carrier): void;

  // Equivalent of performance.now() in the browser and perf_hooks in node
  // Used for comparisons, value is in milliseconds with microsecond decimals.
  now(): number;
  // now() / 1000
  nowSeconds(): number;
  serveMetrics(port: number): void;
  report(report: Report): void;

  close(callback: () => void): void;
}

export type SpanContext = any;

export interface CaptureMonitor extends Monitor {
  setLabels(labels: Labels): void;
  setData(data: Labels): void;
}

export interface Span extends CaptureMonitor {
  end(error?: boolean): void;
}

export type LoggerLogOptions = {
  name: string;
  level: LogLevel;
  message?: string;
  labels?: Labels;
  data?: Labels;
  error?: Error | null;
};

export type FullLogLevelOption = {
  log: LogLevel;
  span: LogLevel;
};

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
export type TracerStartSpanOptions = {
  references?: Array<TracerReference>;
  tags?: Object;
  startTime?: number;
};

export interface Tracer {
  startSpan(name: string, options?: TracerStartSpanOptions): TracerSpan;
  childOf(span: SpanContext | TracerSpan): TracerReference;
  followsFrom(span: SpanContext | TracerSpan): TracerReference;
  extract(format: Format, carrier: Carrier): SpanContext;
  inject(context: SpanContext, format: Format, carrier: Carrier): void;
  close(callback: () => void): void;
}

export interface DefaultMonitorCreate {
  service: string;
  logger?: Logger;
  tracer?: Tracer;
  spanLogLevel?: LogLevel;
}

export class DefaultMonitor implements Monitor {
  static create(options: DefaultMonitorCreate): DefaultMonitor;

  labels: KnownLabels;
  formats: Formats;
  at(component: string): Monitor;
  withLabels(labels: Labels): Monitor;
  withData(data: Labels): Monitor;
  forContext(ctx: Context): Monitor;
  forMessage(message: IncomingMessage): Monitor;

  log(options: LogOptions): void;
  captureLog<TResult>(
    // eslint-disable-next-line
    func: (monitor: CaptureMonitor) => TResult,
    options: CaptureLogOptions,
  ): TResult;
  captureLog<TResult>(
    // eslint-disable-next-line
    func: (monitor: CaptureMonitor) => Promise<TResult>,
    options: CaptureLogOptions,
  ): Promise<TResult>;
  logError(options: LogErrorOptions): void;

  // eslint-disable-next-line
  startSpan(options: SpanOptions): Span;
  captureSpan<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => TResult,
    options: CaptureSpanOptions,
  ): TResult;
  captureSpan<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => Promise<TResult>,
    options: CaptureSpanOptions,
  ): Promise<TResult>;
  captureSpanLog<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => TResult,
    options: CaptureSpanLogOptions,
  ): TResult;
  captureSpanLog<TResult>(
    // eslint-disable-next-line
    func: (span: CaptureMonitor) => Promise<TResult>,
    options: CaptureSpanLogOptions,
  ): Promise<TResult>;

  childOf(span: SpanContext | Monitor): Reference;
  childOf(span: void): void;
  followsFrom(span: SpanContext | Monitor): Reference;
  followsFrom(span: void): void;
  extract(format: Format, carrier: Carrier): SpanContext | void;
  inject(format: Format, carrier: Carrier): void;

  // Equivalent of performance.now() in the browser and perf_hooks in node
  // Used for comparisons, value is in milliseconds with microsecond decimals.
  now(): number;
  // now() / 1000
  nowSeconds(): number;
  serveMetrics(port: number): void;
  report(report: Report): void;

  close(callback: () => void): void;
}
