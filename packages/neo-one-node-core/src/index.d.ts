import { InvocationResult } from '@neo-one/client-core';

export declare interface Settings {}

export declare interface Blockchain {
  settings: Settings;
  invokeScript(buffer: Buffer): Promise<InvocationResult>;
}

export declare interface Storage {}

export declare interface VM {}

export type Endpoint = string;
