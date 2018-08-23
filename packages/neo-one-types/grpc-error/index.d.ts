declare module 'grpc-error' {
  import { status } from 'grpc';
  export default class GRPCError extends Error {
    constructor(message: string, grpcStatus: status);
  }
}
