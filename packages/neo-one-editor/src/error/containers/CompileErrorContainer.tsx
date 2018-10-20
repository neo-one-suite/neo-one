/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// tslint:disable
import * as React from 'react';
import { ErrorOverlay } from '../components/ErrorOverlay';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { CodeBlock } from '../components/CodeBlock';
import { generateAnsiHTML } from '../generateAnsiHTML';
import { parseCompileError, ErrorLocation } from '../parseCompileError';

const codeAnchorStyle = {
  cursor: 'pointer',
};

type Props = {
  error: string;
  editorHandler: (errorLoc: ErrorLocation) => void;
};

export class CompileErrorContainer extends React.PureComponent<Props> {
  render() {
    const { error, editorHandler } = this.props;
    const errLoc: ErrorLocation | undefined = parseCompileError(error);
    const canOpenInEditor = errLoc !== null && editorHandler !== null;
    return (
      <ErrorOverlay>
        <Header headerText="Failed to compile" />
        <div
          onClick={canOpenInEditor && errLoc ? () => editorHandler(errLoc) : undefined}
          style={canOpenInEditor ? codeAnchorStyle : undefined}
        >
          <CodeBlock main={true} codeHTML={generateAnsiHTML(error)} />
        </div>
        <Footer line1="This error occurred during the build time and cannot be dismissed." />
      </ErrorOverlay>
    );
  }
}
