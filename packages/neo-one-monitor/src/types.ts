import { IncomingMessage } from 'http';
import { Context } from 'koa';

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
export type LabelValue = string | number | boolean | void | undefined;
export interface Labels {
  readonly [label: string]: LabelValue;
}

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
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
export type LogLevelOption =
  | LogLevel
  | {
      readonly log: LogLevel;
      readonly span?: LogLevel;
    };

export enum KnownLabel {
  SERVICE = 'service',
  COMPONENT = 'component',
  // Database instance name. E.g. main
  DB_INSTANCE = 'db.instance',
  // Database statement. E.g. SELECT * FROM wuser table;
  DB_STATEMENT = 'db.statement',
  // Database type. For any SQL database, "sql". For others, the lower-case
  // database category, e.g. "cassandra", "hbase", or "redis".
  DB_TYPE = 'db.type',
  // Username for accessing database. E.g., "readonly_user" or "reporting_user"
  DB_USER = 'db.user',
  // true if and only if the application considers the operation to have failed
  ERROR = 'error',
  // Error code if available or constructor name
  ERROR_KIND = 'error.kind',
  // Actual Error object
  ERROR_OBJECT = 'error.object',
  // Error stack
  ERROR_STACK = 'stack',
  // HTTP method of the request for the associated Span. E.g., "GET", "POST"
  HTTP_METHOD = 'http.method',
  // HTTP response status code for the associated Span. E.g., 200, 503, 404
  HTTP_STATUS_CODE = 'http.status_code',
  // URL of the request being handled in this segment of the trace, in standard
  // URI format. E.g., "https://domain.net/path/to?resource=here"
  HTTP_URL = 'http.url',
  // An address at which messages can be exchanged. E.g. A Kafka record has an
  // associated "topic name" that can be extracted by the instrumented producer
  // or consumer and stored using this tag.
  MESSAGE_BUS_DESTINATION = 'message_bus.destination',
  // Remote "address", suitable for use in a networking client library. This may
  // be a "ip:port", a bare "hostname", a FQDN, or even a JDBC substring like
  // "mysql://prod-db:3306"
  PEER_ADDRESS = 'peer.address',
  // Remote hostname. E.g., "opentracing.io", "internal.dns.name"
  PEER_HOSTNAME = 'peer.hostname',
  // Remote IPv4 address as a .-separated tuple. E.g., "127.0.0.1"
  PEER_IPV4 = 'peer.ipv4',
  // Remote IPv6 address as a string of colon-separated 4-char hex tuples.
  // E.g., "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
  PEER_IPV6 = 'peer.ipv6',
  // Remote port. E.g., 80
  PEER_PORT = 'peer.port',
  // Remote service name (for some unspecified definition of "service").
  // E.g., "elasticsearch", "a_custom_microservice", "memcache"
  PEER_SERVICE = 'peer.service',
  // If greater than 0, a hint to the Tracer to do its best to capture the
  // trace. If 0, a hint to the trace to not-capture the trace. If absent,
  // the Tracer should use its default sampling mechanism.
  SAMPLING_PRIORITY = 'sampling.priority',
  // Either "client" or "server" for the appropriate roles in an RPC, and
  // "producer" or "consumer" for the appropriate roles in a messaging scenario.
  SPAN_KIND = 'span.kind',

  // Low cardinality version of db.statement
  DB_STATEMENT_SUMMARY = 'db.statement.summary',
  // The path of the request. Must be low cardinality. E.g. /account/:id
  // not /account/123
  HTTP_PATH = 'http.path',
  // Full path of the request, high cardinality.
  HTTP_FULLPATH = 'http.full_path',
  // The user agent for the request.
  HTTP_USER_AGENT = 'http.user_agent',
  // Request length
  HTTP_REQUEST_SIZE = 'http.request.size',
  // Headers
  HTTP_HEADERS = 'http.headers',
  // Request protocol
  HTTP_REQUEST_PROTOCOL = 'http.request.protocol',
  // Request querystring
  HTTP_REQUEST_QUERY = 'http.request.query',
  // RPC method called. E.g. getblock.
  RPC_METHOD = 'rpc.method',
  // RPC type, e.g. jsonrpc.
  RPC_TYPE = 'rpc.type',
}

export enum Format {
  HTTP = 'http_headers',
  TEXT = 'text_map',
  BINARY = 'binary',
}
export interface Carrier {
  readonly __carrier: undefined;
}

export interface CollectedLoggerLogOptions {
  readonly name: string;
  readonly level: LogLevel;
  readonly message?: string;
  readonly labels?: Labels;
  readonly data?: Labels;
  readonly error?: {
    readonly message?: string;
    readonly stack?: string;
    readonly code?: string;
  };
}

export interface MetricOptions {
  readonly name: string;
  readonly help?: string;
  readonly labelNames?: ReadonlyArray<Label>;
  readonly labels?: ReadonlyArray<Labels>;
}

export interface BucketedMetricOptions extends MetricOptions {
  readonly buckets?: ReadonlyArray<number>;
}

export interface PercentiledMetricOptions extends MetricOptions {
  readonly percentiles?: ReadonlyArray<number>;
}

export type AllMetricOptions = MetricOptions | BucketedMetricOptions | PercentiledMetricOptions;

export interface MetricValue {
  readonly countOrLabels?: Labels | number;
  readonly count?: number;
}

export interface CollectedMetric<T extends MetricOptions | BucketedMetricOptions> {
  readonly metric: T;
  readonly values: ReadonlyArray<MetricValue>;
}
export interface CollectedMetrics<T extends MetricOptions | BucketedMetricOptions> {
  readonly [name: string]: CollectedMetric<T>;
}

export interface MetricCollection {
  readonly counters: CollectedMetrics<MetricOptions>;
  readonly histograms: CollectedMetrics<BucketedMetricOptions>;
}

export interface Report {
  readonly logs: ReadonlyArray<CollectedLoggerLogOptions>;
  readonly metrics: MetricCollection;
}

export interface CounterBase {
  // tslint:disable no-method-signature
  inc(count?: number): void;
  inc(labels?: Labels, count?: number): void;
  // tslint:enable no-method-signature
}

export interface Counter extends CounterBase {
  readonly getLabelNames: () => ReadonlyArray<Label>;
}

export interface GaugeBase {
  // tslint:disable no-method-signature
  inc(count?: number): void;
  inc(labels?: Labels, count?: number): void;
  dec(count?: number): void;
  dec(labels?: Labels, count?: number): void;
  set(value: number): void;
  set(labels: Labels, value: number): void;
  // tslint:enable no-method-signature
}

export interface Gauge extends GaugeBase {
  readonly getLabelNames: () => ReadonlyArray<Label>;
}

export interface HistogramBase {
  // tslint:disable no-method-signature
  observe(value: number): void;
  observe(labels: Labels, value: number): void;
  // tslint:enable no-method-signature
}

export interface Histogram extends HistogramBase {
  readonly getLabelNames: () => ReadonlyArray<Label>;
}

export interface SummaryBase {
  // tslint:disable no-method-signature
  observe(value: number): void;
  observe(labels: Labels, value: number): void;
  // tslint:enable no-method-signature
}

export interface Summary extends SummaryBase {
  readonly getLabelNames: () => ReadonlyArray<Label>;
}

export type Metric = Counter | Gauge | Histogram | Summary;

export interface MetricsFactory {
  readonly reset_forTest: () => void;
  readonly createCounter: (options: MetricOptions) => Counter;
  readonly createGauge: (options: MetricOptions) => Gauge;
  readonly createHistogram: (options: BucketedMetricOptions) => Histogram;
  readonly createSummary: (options: PercentiledMetricOptions) => Summary;

  readonly setFactory: (factory: MetricsFactory) => void;
}

export interface LogOptions {
  readonly name: string;
  readonly message?: string; // Human readable string.
  readonly level?: LogLevel;
  readonly metric?: Counter;

  readonly error?: {
    readonly metric?: Counter;
    readonly error?: Error | undefined;
    readonly message?: string;
    readonly level?: LogLevel;
  };
}

export interface CaptureLogOptions {
  readonly name: string;
  readonly message?: string;
  readonly level?: LogLevel;

  readonly metric?: Counter;

  readonly error?:
    | string
    | {
        readonly metric?: Counter;
        readonly message?: string;
        readonly level?: LogLevel;
      };
}

export interface LogErrorOptions {
  readonly name: string;
  readonly message?: string;
  readonly error: Error;
  readonly level?: LogLevel;
  readonly metric?: Counter;
}

export interface Reference {
  readonly __brand: 'Reference';
}

export interface SpanOptions {
  readonly name: string;
  readonly level?: LogLevel;

  readonly metric?: {
    readonly total: Histogram | Summary;
    readonly error: Counter;
  };

  readonly references?: ReadonlyArray<Reference | void>;
  readonly trace?: boolean; // Is this allowed to be a top level span?
}

export interface CaptureSpanOptions {
  readonly name: string;
  readonly level?: LogLevel;

  readonly metric?: {
    readonly total: Histogram | Summary;
    readonly error: Counter;
  };

  readonly references?: ReadonlyArray<Reference | void>;
  readonly trace?: boolean; // Is this allowed to be a top level span?
}

export interface CaptureSpanLogOptions {
  readonly name: string;
  readonly message?: string;
  readonly level?: LogLevelOption;

  readonly metric?: {
    readonly total: Histogram | Summary;
    readonly error: Counter;
  };

  readonly error?:
    | string
    | {
        readonly message?: string;
        readonly level?: LogLevel;
      };
  readonly references?: ReadonlyArray<Reference | void>;
  readonly trace?: boolean; // Is this allowed to be a top level span?
}

/*
Usage:
Do you want to log a message? monitor.log
Do you want to add metadata to all subsequent monitoring? monitor.withLabels
Do you want to time something? monitor.startSpan
Did you enter a new component? monitor.at
*/
export interface Monitor {
  readonly labels: typeof KnownLabel;
  readonly formats: typeof Format;
  readonly at: (component: string) => Monitor;
  readonly withLabels: (labels: Labels) => Monitor;
  readonly withData: (data: Labels) => Monitor;
  readonly forContext: (ctx: Context) => Monitor;
  readonly forMessage: (message: IncomingMessage) => Monitor;

  readonly log: (options: LogOptions) => void;
  readonly captureLog: <TResult>(func: (monitor: CaptureMonitor) => TResult, options: CaptureLogOptions) => TResult;
  readonly logError: (options: LogErrorOptions) => void;

  readonly startSpan: (options: SpanOptions) => Span;
  readonly captureSpan: <TResult>(func: (span: CaptureMonitor) => TResult, options: CaptureSpanOptions) => TResult;
  readonly captureSpanLog: <TResult>(
    func: (span: CaptureMonitor) => TResult,
    options: CaptureSpanLogOptions,
  ) => TResult;

  readonly childOf: <T extends SpanContext | Monitor | undefined>(
    span: T,
  ) => T extends undefined ? undefined : Reference;
  readonly followsFrom: <T extends SpanContext | Monitor | undefined>(
    span: T,
  ) => T extends undefined ? undefined : Reference;
  readonly extract: (format: Format, carrier: Carrier) => SpanContext | undefined;
  readonly inject: (format: Format, carrier: Carrier) => void;

  // Equivalent of performance.now() in the browser and perf_hooks in node
  // Used for comparisons, value is in milliseconds with microsecond decimals.
  readonly now: () => number;
  // now() / 1000
  readonly nowSeconds: () => number;
  readonly serveMetrics: (port: number) => void;
  readonly report: (report: Report) => void;

  readonly close: (callback: () => void) => void;
}

export interface SpanContext {
  readonly __brand: 'SpanContext';
}

export interface CaptureMonitor extends Monitor {
  readonly setLabels: (labels: Labels) => void;
  readonly setData: (data: Labels) => void;
}

export interface Span extends CaptureMonitor {
  readonly end: (error?: boolean) => void;
}

export interface LoggerLogOptions {
  readonly name: string;
  readonly level: LogLevel;
  readonly message?: string;
  readonly labels?: Labels;
  readonly data?: Labels;
  readonly error?: Error | undefined;
}

export interface Logger {
  readonly log: (options: LoggerLogOptions) => void;
  readonly close: (callback: () => void) => void;
}
