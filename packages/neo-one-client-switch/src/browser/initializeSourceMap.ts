import { SourceMapConsumer } from 'source-map';

// tslint:disable-next-line no-let
let initialized = false;
export const initializeSourceMap = () => {
  if (!initialized) {
    initialized = true;
    // tslint:disable-next-line no-any
    (SourceMapConsumer as any).initialize({
      'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
    });
  }
};
