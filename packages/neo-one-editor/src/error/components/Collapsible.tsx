/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// tslint:disable no-any prefer-template
import * as React from 'react';
import { black } from '../styles';

const _collapsibleStyle = {
  color: black,
  cursor: 'pointer',
  border: 'none',
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: '#fff',
  fontFamily: 'Consolas, Menlo, monospace',
  fontSize: '1em',
  padding: '0px',
  lineHeight: '1.5',
};

const collapsibleCollapsedStyle: any = {
  ..._collapsibleStyle,
  marginBottom: '1.5em',
};

const collapsibleExpandedStyle: any = {
  ..._collapsibleStyle,
  marginBottom: '0.6em',
};

interface Props {
  readonly children: ReadonlyArray<React.ReactElement<any>>;
}

interface State {
  readonly collapsed: boolean;
}

export class Collapsible extends React.Component<Props, State> {
  public readonly state = {
    collapsed: true,
  };

  public readonly toggleCollaped = () => {
    this.setState((state) => ({
      collapsed: !state.collapsed,
    }));
  };

  public render() {
    const count = this.props.children.length;
    const collapsed = this.state.collapsed;

    return (
      <div>
        <button onClick={this.toggleCollaped} style={collapsed ? collapsibleCollapsedStyle : collapsibleExpandedStyle}>
          {(collapsed ? '▶' : '▼') + ` ${count} stack frames were ` + (collapsed ? 'collapsed.' : 'expanded.')}
        </button>
        <div style={{ display: collapsed ? 'none' : 'block' }}>
          {this.props.children}
          <button onClick={this.toggleCollaped} style={collapsibleExpandedStyle}>
            {`▲ ${count} stack frames were expanded.`}
          </button>
        </div>
      </div>
    );
  }
}
