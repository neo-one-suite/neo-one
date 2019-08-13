export enum Labels {
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
  // additional ones taken in from `@neo-one/utils'
  PLUGIN_NAME = 'plugin.name',
  RESOURCETYPE_NAME = 'resource_type.name',
  NODE_NAME = 'node.name',
  OP_CODE = 'neo.op.code',
  NEO_ADDRESS = 'neo.address',
  NODE_OPTIONSPATH = 'node.options_path',
  NEO_TRANSACTION_HASH = 'neo.transaction.hash',
  NEO_TRANSACTION_TYPE = 'neo.transaction.type',
  NEO_TRANSACTION_FOUND = 'neo.transaction.found',
  NEO_CONSENSUS_HASH = 'neo.consensus.hash',
  NEO_BLOCK_INDEX = 'neo.block.index',
  CALL_METHOD = 'call.method',
  INVOKE_METHOD = 'invoke.method',
  INVOKE_RAW_METHOD = 'invoke_raw.method',
  JSONRPC_TYPE = 'jsonrpc.type',
  COMMAND_NAME = 'command.name',
}

export const labelToTag = (label: string) => ({
  name: label.replace(/\./g, '_'),
});

export const labelsToTags = (labels: readonly string[]) => labels.map(labelToTag);
