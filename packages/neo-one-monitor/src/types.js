/* @flow */
import type { Context } from 'koa';

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
export type Labels = { [label: Label]: ?string | ?number | ?boolean | void };

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
  | {|
      log: LogLevel,
      metric?: LogLevel,
      span?: LogLevel,
    |};

export type LogMetricOptions = {|
  type: 'counter' | 'gauge' | 'histogram' | 'summary',
  value?: number,
  suffix: string,
|};

export type LogOptions = {|
  name: string, // Lowercase. Increments a counter for the same event.
  message: string, // Human readable string.
  level?: LogLevelOption,

  help?: string, // Description of the event.
  metric?: LogMetricOptions,

  error?: {
    error?: ?Error,
    message: string,
    level?: LogLevel,
  },
|};

export type LogSingleOptions = {|
  name: string,
  message: string,
  level?: LogLevelOption,

  error?: {
    error?: ?Error,
    message: string,
    level?: LogLevel,
  },
|};

export type CaptureErrorOptions =
  | string
  | {|
      message: string,
      level: LogLevel,
    |};

export type CaptureLogOptions = {|
  name: string,
  message: string,
  level?: LogLevelOption,

  help?: string,
  metric?: LogMetricOptions,

  error?: CaptureErrorOptions,
|};

export type CaptureLogSingleOptions = {|
  name: string,
  message: string,
  level?: LogLevelOption,

  error?: CaptureErrorOptions,
|};

export type LogErrorOptions = {|
  name: string,
  message: string,
  error: Error,
  level?: LogLevelOption,

  help?: string,
  metric?: LogMetricOptions,
|};

export type LogErrorSingleOptions = {|
  name: string,
  message: string,
  error: Error,
  level?: LogLevelOption,
|};

export type MetricOptions = {|
  name: string,
  help?: string,
  labelNames?: Array<Label>,
|};

export opaque type Reference = any;

export type SpanOptions = {|
  name: string,
  level?: LogLevelOption,

  help?: string,

  references?: Array<Reference>,
|};

export type CaptureSpanOptions = {|
  name: string,
  level?: LogLevelOption,

  help?: string,

  references?: Array<Reference>,
|};

export interface Counter {
  inc(count?: number): void;
  inc(labels?: Labels, count?: number): void;
}

export interface Gauge {
  inc(count?: number): void;
  inc(labels?: Labels, count?: number): void;
  dec(count?: number): void;
  dec(labels?: Labels, count?: number): void;
  set(value: number): void;
  set(labels: Labels, value: number): void;
}

export interface Histogram {
  observe(value: number): void;
  observe(labels: Labels, value: number): void;
}

export interface Summary {
  observe(value: number): void;
  observe(labels: Labels, value: number): void;
}

export type KnownLabels = {|
  // Database instance name. E.g. main
  DB_INSTANCE: 'db.instance',
  // Database statement. E.g. SELECT * FROM wuser table;
  DB_STATEMENT: 'db.statement',
  // Database type. For any SQL database, "sql". For others, the lower-case
  // database category, e.g. "cassandra", "hbase", or "redis".
  DB_TYPE: 'db.type',
  // Username for accessing database. E.g., "readonly_user" or "reporting_user"
  DB_USER: 'db.user',
  // true if and only if the application considers the operation to have failed
  ERROR: 'error',
  // HTTP method of the request for the associated Span. E.g., "GET", "POST"
  HTTP_METHOD: 'http.method',
  // HTTP response status code for the associated Span. E.g., 200, 503, 404
  HTTP_STATUS_CODE: 'http.status_code',
  // URL of the request being handled in this segment of the trace, in standard
  // URI format. E.g., "https://domain.net/path/to?resource=here"
  HTTP_URL: 'http.url',
  // An address at which messages can be exchanged. E.g. A Kafka record has an
  // associated "topic name" that can be extracted by the instrumented producer
  // or consumer and stored using this tag.
  MESSAGE_BUS_DESTINATION: 'message_bus.destination',
  // Remote "address", suitable for use in a networking client library. This may
  // be a "ip:port", a bare "hostname", a FQDN, or even a JDBC substring like
  // "mysql://prod-db:3306"
  PEER_ADDRESS: 'peer.address',
  // Remote hostname. E.g., "opentracing.io", "internal.dns.name"
  PEER_HOSTNAME: 'peer.hostname',
  // Remote IPv4 address as a .-separated tuple. E.g., "127.0.0.1"
  PEER_IPV4: 'peer.ipv4',
  // Remote IPv6 address as a string of colon-separated 4-char hex tuples.
  // E.g., "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
  PEER_IPV6: 'peer.ipv6',
  // Remote port. E.g., 80
  PEER_PORT: 'peer.port',
  // Remote service name (for some unspecified definition of "service").
  // E.g., "elasticsearch", "a_custom_microservice", "memcache"
  PEER_SERVICE: 'peer.service',
  // If greater than 0, a hint to the Tracer to do its best to capture the
  // trace. If 0, a hint to the trace to not-capture the trace. If absent,
  // the Tracer should use its default sampling mechanism.
  SAMPLING_PRIORITY: 'sampling.priority',
  // Either "client" or "server" for the appropriate roles in an RPC, and
  // "producer" or "consumer" for the appropriate roles in a messaging scenario.
  SPAN_KIND: 'span.kind',

  // The path of the request. Must be low cardinality. E.g. /account/:id
  // not /account/123
  HTTP_PATH: 'http.path',
  // RPC method called. E.g. getblock.
  RPC_METHOD: 'rpc.method',
  // RPC type, e.g. jsonrpc.
  RPC_TYPE: 'rpc.type',
|};

export type Format = 'http_headers' | 'text_map' | 'binary';
export type Carrier = any;

/*
Usage:
Do you want to count something? monitor.getCounter
Do you want to log a message? monitor.log
Do you want to add metadata to all subsequent monitoring? monitor.withLabels
Do you want to time something? monitor.startSpan
Did you enter a new component? monitor.at
Did you enter a sub-component? monitor.sub
*/
export interface Monitor {
  labels: KnownLabels;
  at(namespace: string): Monitor;
  sub(namespace: string): Monitor;
  withLabels(labels: Labels): Monitor;
  withData(data: Labels): Monitor;
  forRequest(ctx: Context): Monitor;

  log(options: LogOptions): void;
  captureLog<TResult>(
    func: (monitor: Monitor) => TResult,
    options: CaptureLogOptions,
  ): TResult;
  captureLog<TResult>(
    func: (monitor: Monitor) => Promise<TResult>,
    options: CaptureLogOptions,
  ): Promise<TResult>;
  logSingle(options: LogSingleOptions): void;
  captureLogSingle<TResult>(
    func: (monitor: Monitor) => TResult,
    options: CaptureLogSingleOptions,
  ): TResult;
  captureLogSingle<TResult>(
    func: (monitor: Monitor) => Promise<TResult>,
    options: CaptureLogSingleOptions,
  ): Promise<TResult>;
  logError(options: LogErrorOptions): void;
  logErrorSingle(options: LogErrorSingleOptions): void;

  getCounter(options: MetricOptions): Counter;
  getGauge(options: MetricOptions): Gauge;
  getHistogram(options: MetricOptions): Histogram;
  getSummary(options: MetricOptions): Summary;

  // eslint-disable-next-line
  startSpan(options: SpanOptions): Span;
  captureSpan<TResult>(
    // eslint-disable-next-line
    func: (span: Span) => TResult,
    options: CaptureSpanOptions,
  ): TResult;
  captureSpan<TResult>(
    // eslint-disable-next-line
    func: (span: Span) => Promise<TResult>,
    options: CaptureSpanOptions,
  ): Promise<TResult>;

  childOf(span: SpanContext | Monitor): Reference;
  followsFrom(span: SpanContext | Monitor): Reference;
  extract(format: Format, carrier: Carrier): SpanContext;
  inject(format: Format, carrier: Carrier): void;

  nowSeconds(): number;
  close(callback: () => void): void;
}

export opaque type SpanContext = any;

export interface Span extends Monitor {
  setLabels(labels: Labels): void;
  setData(data: Labels): void;
  end(error?: boolean): void;
}
