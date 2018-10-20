/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// tslint:disable
import React from 'react';
import { StackFrame } from './StackFrame';
import { Collapsible } from '../components/Collapsible';
import { isInternalFile } from '../isInternalFile';
import { isBuiltinErrorName } from '../isBuiltinErrorName';
import { StackFrame as StackFrameType } from '../StackFrame';
import { ErrorLocation } from '../parseCompileError';

const traceStyle = {
  fontSize: '1em',
  flex: '0 1 auto',
  minHeight: '0px',
  overflow: 'auto',
};

type Props = {
  stackFrames: StackFrameType[];
  errorName: string;
  contextSize: number;
  editorHandler: (errorLoc: ErrorLocation) => void;
};

export class StackTrace extends React.Component<Props> {
  renderFrames() {
    const { stackFrames, errorName, contextSize, editorHandler } = this.props;
    const renderedFrames: any[] = [];
    let hasReachedAppCode = false,
      currentBundle: any[] = [],
      bundleCount = 0;

    stackFrames.forEach((frame, index) => {
      const { fileName, _originalFileName: sourceFileName } = frame;
      const isInternalUrl = isInternalFile(sourceFileName, fileName);
      const isThrownIntentionally = !isBuiltinErrorName(errorName);
      const shouldCollapse = isInternalUrl && (isThrownIntentionally || hasReachedAppCode);

      if (!isInternalUrl) {
        hasReachedAppCode = true;
      }

      const frameEle = (
        <StackFrame
          key={'frame-' + index}
          frame={frame}
          contextSize={contextSize}
          critical={index === 0}
          showCode={!shouldCollapse}
          editorHandler={editorHandler}
        />
      );
      const lastElement = index === stackFrames.length - 1;

      if (shouldCollapse) {
        currentBundle.push(frameEle);
      }

      if (!shouldCollapse || lastElement) {
        if (currentBundle.length === 1) {
          renderedFrames.push(currentBundle[0]);
        } else if (currentBundle.length > 1) {
          bundleCount++;
          renderedFrames.push(<Collapsible key={'bundle-' + bundleCount}>{currentBundle}</Collapsible>);
        }
        currentBundle = [];
      }

      if (!shouldCollapse) {
        renderedFrames.push(frameEle);
      }
    });

    return renderedFrames;
  }

  render() {
    return <div style={traceStyle}>{this.renderFrames()}</div>;
  }
}
