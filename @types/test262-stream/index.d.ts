import { Stream } from 'stream';

export interface TestFlags {
  module: boolean;
  onlyStrict: boolean;
  noStrict: boolean;
  raw: boolean;
  async: boolean;
  generated: boolean;
}
export type TestNegativePhase = 'early' | 'parse' | 'resolution' | 'runtime';
export interface TestNegative {
  phase: TestNegativePhase;
  type: string;
}
export interface TestAttrs {
  description: string;
  info: string;
  flags: TestFlags;
  negative?: TestNegative;
  features: string[];
  esid: string;
  es5id: string;
  es6id: string;
  includes: string[];
  timeout?: number;
  author: string;
}
export interface Test {
  file: string;
  scenario: string;
  contents: string;
  attrs: TestAttrs;
  async: boolean;
}
export default class TestStream extends Stream {
  constructor(file: string, options: any);
}
