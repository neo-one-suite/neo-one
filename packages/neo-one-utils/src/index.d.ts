export declare type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'verbose'
  | 'debug'
  | 'silly';

export declare type LogValue =
  | { [key: string]: any }
  | Array<any>
  | number
  | string
  | boolean
  | Error
  | undefined;

export declare interface LogData {
  error?: Error | undefined;
  [key: string]: LogValue;
}

export declare interface LogMessage {
  event: string;
  level?: LogLevel | undefined;
  error?: Error | undefined;
  [key: string]: LogValue;
}
export declare type Log = (
  message: LogMessage,
  onLogComplete?: () => void,
) => void;

export namespace finalize {
  export function wait(): Promise<void>;
}
