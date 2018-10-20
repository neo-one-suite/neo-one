/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** A container holding a script line. */
export class ScriptLine {
  /** The line number of this line of source. */
  public readonly lineNumber: number;
  /** The content (or value) of this line of source. */
  public readonly content: string;
  /** Whether or not this line should be highlighted. Particularly useful for error reporting with context. */
  public readonly highlight: boolean;

  public constructor(lineNumber: number, content: string, highlight = false) {
    this.lineNumber = lineNumber;
    this.content = content;
    this.highlight = highlight;
  }
}

/**
 * A representation of a stack frame.
 */
export class StackFrame {
  public readonly functionName: string | undefined;
  public readonly fileName: string | undefined;
  public readonly lineNumber: number | undefined;
  public readonly columnNumber: number | undefined;

  public readonly _originalFunctionName: string | undefined;
  public readonly _originalFileName: string | undefined;
  public readonly _originalLineNumber: number | undefined;
  public readonly _originalColumnNumber: number | undefined;

  public readonly _scriptCode: ReadonlyArray<ScriptLine> | undefined;
  public readonly _originalScriptCode: ReadonlyArray<ScriptLine> | undefined;

  public constructor(
    functionNameIn?: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number,
    scriptCode?: ReadonlyArray<ScriptLine>,
    sourceFunctionName?: string,
    sourceFileName?: string,
    sourceLineNumber?: number,
    sourceColumnNumber?: number,
    sourceScriptCode?: ReadonlyArray<ScriptLine>,
  ) {
    // tslint:disable-next-line no-let
    let functionName = functionNameIn;
    if (functionName && functionName.indexOf('Object.') === 0) {
      functionName = functionName.slice('Object.'.length);
    }
    if (
      // Chrome has a bug with inferring function.name:
      // https://github.com/facebook/create-react-app/issues/2097
      // Let's ignore a meaningless name we get for top-level modules.
      functionName === 'friendlySyntaxErrorLabel' ||
      functionName === 'exports.__esModule' ||
      functionName === '<anonymous>' ||
      !functionName
    ) {
      functionName = undefined;
    }
    this.functionName = functionName;

    this.fileName = fileName;
    this.lineNumber = lineNumber;
    this.columnNumber = columnNumber;

    this._originalFunctionName = sourceFunctionName;
    this._originalFileName = sourceFileName;
    this._originalLineNumber = sourceLineNumber;
    this._originalColumnNumber = sourceColumnNumber;

    this._scriptCode = scriptCode;
    this._originalScriptCode = sourceScriptCode;
  }

  /**
   * Returns the name of this function.
   */
  public getFunctionName(): string {
    return this.functionName === undefined ? '(anonymous function)' : this.functionName;
  }

  /**
   * Returns the name of this function.
   */
  public getMappedFunctionName(): string {
    return this._originalFunctionName === undefined ? this.getFunctionName() : this._originalFunctionName;
  }

  /**
   * Returns the source of the frame.
   * This contains the file name, line number, and column number when available.
   */
  public getSource(): string {
    let str = '';
    if (this.fileName !== undefined) {
      str += `${this.fileName}:`;
    }
    if (this.lineNumber !== undefined) {
      str += `${this.lineNumber}:`;
    }
    if (this.columnNumber !== undefined) {
      str += `${this.columnNumber}:`;
    }

    return str.slice(0, -1);
  }

  /**
   * Returns the source of the frame.
   * This contains the file name, line number, and column number when available.
   */
  public getMappedSource(): string {
    if (
      this._originalFileName === undefined &&
      this._originalLineNumber === undefined &&
      this._originalColumnNumber === undefined
    ) {
      return this.getSource();
    }

    let str = '';
    if (this._originalFileName !== undefined) {
      str += `${this._originalFileName}:`;
    }
    if (this._originalLineNumber !== undefined) {
      str += `${this._originalLineNumber}:`;
    }
    if (this._originalColumnNumber !== undefined) {
      str += `${this._originalColumnNumber}:`;
    }

    return str.slice(0, -1);
  }

  /**
   * Returns a pretty version of this stack frame.
   */
  public toString(): string {
    const functionName = this.getFunctionName();
    const source = this.getSource();

    return `${functionName}${source ? ` (${source})` : ``}`;
  }

  public toMappedString(): string {
    const functionName = this.getMappedFunctionName();
    const source = this.getMappedSource();

    return `${functionName}${source ? ` (${source})` : ``}`;
  }
}
