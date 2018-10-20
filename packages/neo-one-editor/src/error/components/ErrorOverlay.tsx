/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { black } from '../styles';

// tslint:disable-next-line no-any
const overlayStyle: any = {
  position: 'relative',
  display: 'inline-flex',
  flexDirection: 'column',
  height: '100%',
  width: '1024px',
  maxWidth: '100%',
  overflowX: 'hidden',
  overflowY: 'auto',
  padding: '0.5rem',
  boxSizing: 'border-box',
  textAlign: 'left',
  fontFamily: 'Consolas, Menlo, monospace',
  fontSize: '11px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.5,
  color: black,
};

interface Props {
  readonly children: React.ReactNode;
  readonly shortcutHandler?: (eventKey: string) => void;
}

interface State {
  readonly collapsed: boolean;
}

export class ErrorOverlay extends React.Component<Props, State> {
  // tslint:disable-next-line readonly-keyword
  public iframeWindow: Window | undefined;

  public readonly getIframeWindow = (element: HTMLDivElement | null) => {
    if (element) {
      const document = element.ownerDocument;
      if (document) {
        // tslint:disable-next-line no-object-mutation
        this.iframeWindow = document.defaultView === null ? undefined : document.defaultView;
      }
    }
  };

  public readonly onKeyDown = (e: KeyboardEvent) => {
    const { shortcutHandler } = this.props;
    if (shortcutHandler) {
      shortcutHandler(e.key);
    }
  };

  public componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
    if (this.iframeWindow) {
      this.iframeWindow.addEventListener('keydown', this.onKeyDown);
    }
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.iframeWindow) {
      this.iframeWindow.removeEventListener('keydown', this.onKeyDown);
    }
  }

  public render() {
    return (
      <div style={overlayStyle} ref={this.getIframeWindow}>
        {this.props.children}
      </div>
    );
  }
}
