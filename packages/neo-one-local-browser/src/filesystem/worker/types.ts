// tslint:disable no-any
export type ResponseMessageType = 'uncaughtError' | 'error' | 'success' | 'update';
export interface ResponseMessage {
  readonly type: ResponseMessageType;
  readonly instanceID: string;
  readonly messageID: string;
  readonly result: any;
}

export type RequestArgs = readonly any[];
export type RequestType =
  | 'post'
  | 'put'
  | 'putAttachment'
  | 'removeAttachment'
  | 'remove'
  | 'revsDiff'
  | 'compact'
  | 'bulkGet'
  | 'get'
  | 'getAttachment'
  | 'allDocs'
  | 'close'
  | 'info'
  | 'id'
  | 'bulkDocs'
  | 'destroy'
  | 'liveChanges'
  | 'cancelChanges'
  | 'changes'
  | 'construct';
export interface RequestMessage {
  readonly type: RequestType;
  readonly instanceID: string;
  readonly messageID: string;
  readonly args: RequestArgs;
}
