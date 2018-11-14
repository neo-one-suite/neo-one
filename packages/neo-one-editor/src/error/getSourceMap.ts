/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { initializeSourceMap } from '@neo-one/client-switch';
import fetch from 'cross-fetch';
import { SourceMapConsumer } from 'source-map';

/**
 * A wrapped instance of a <code>{@link https://github.com/mozilla/source-map SourceMapConsumer}</code>.
 *
 * This exposes methods which will be indifferent to changes made in <code>{@link https://github.com/mozilla/source-map source-map}</code>.
 */
export class SourceMap {
  private readonly sourceMap: SourceMapConsumer;

  // tslint:disable-next-line no-any
  public constructor(sourceMap: any) {
    this.sourceMap = sourceMap;
  }

  /**
   * Returns the original code position for a generated code position.
   */
  public getOriginalPosition(
    line: number,
    column: number,
  ): {
    readonly name: string | undefined;
    readonly source: string | undefined;
    readonly line: number | undefined;
    readonly column: number | undefined;
  } {
    const { name, line: l, column: c, source: s } = this.sourceMap.originalPositionFor({
      line,
      column,
    });

    return {
      name: name === null ? undefined : name,
      line: l === null ? undefined : l,
      column: c === null ? undefined : c,
      source: s === null ? undefined : s,
    };
  }

  /**
   * Returns the generated code position for an original position.
   */
  public getGeneratedPosition(
    source: string,
    line: number,
    column: number,
  ): { readonly line: number | undefined; readonly column: number | undefined } {
    const { line: l, column: c } = this.sourceMap.generatedPositionFor({
      source,
      line,
      column,
    });

    return {
      line: l === null ? undefined : l,
      column: c === null ? undefined : c,
    };
  }

  /**
   * Returns the code for a given source file name.
   */
  public getSource(sourceName: string): string | undefined {
    const result = this.sourceMap.sourceContentFor(sourceName);

    return result === null ? undefined : result;
  }

  public destroy(): void {
    this.sourceMap.destroy();
  }
}

export async function extractSourceMapUrl(fileUri: string, fileContents: string): Promise<string> {
  const regex = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/gm;
  let match;
  // tslint:disable-next-line no-loop-statement
  while (true) {
    const next = regex.exec(fileContents);
    if (next === null) {
      break;
    }
    match = next;
  }
  if (!(match && match[1])) {
    return Promise.reject(`Cannot find a source map directive for ${fileUri}.`);
  }

  return Promise.resolve(match[1].toString());
}

/**
 * Returns an instance of <code>{@link SourceMap}</code> for a given fileUri and fileContents.
 */
export async function getSourceMap(fileUri: string, fileContents: string): Promise<SourceMap> {
  initializeSourceMap();

  let sm = await extractSourceMapUrl(fileUri, fileContents);
  if (sm.indexOf('data:') === 0) {
    const base64 = /^data:application\/json;([\w=:"-]+;)*base64,/;
    const match2 = sm.match(base64);
    if (!match2) {
      throw new Error('Sorry, non-base64 inline source-map encoding is not supported.');
    }
    sm = sm.substring(match2[0].length);
    sm = window.atob(sm);
    sm = JSON.parse(sm);

    const consumer = await new SourceMapConsumer(sm);

    return new SourceMap(consumer);
  }

  const index = fileUri.lastIndexOf('/');
  const url = fileUri.substring(0, index + 1) + sm;
  const obj = await fetch(url).then(async (res) => res.json());

  const consumerOuter = await new SourceMapConsumer(obj);

  return new SourceMap(consumerOuter);
}
