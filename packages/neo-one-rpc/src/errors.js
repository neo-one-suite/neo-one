/* @flow */
export class RPCError extends Error {
  code: number;
  // flowlint-next-line unclear-type:off
  data: ?Object;

  // flowlint-next-line unclear-type:off
  constructor(code: number, message: string, data?: ?Object) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

export class RPCUnknownError extends Error {
  code: string;
  error: $FlowFixMe;

  constructor(error: $FlowFixMe) {
    super('Unknown RPC Error');
    this.code = 'RPC_UNKNOWN';
    this.error = error;
  }
}
