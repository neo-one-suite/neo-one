/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* @flow */
import React from 'react';
import { red, redTransparent } from '../styles';

const navigationBarStyle = {
  marginBottom: '0.5rem',
};

const buttonContainerStyle = {
  marginRight: '1em',
};

const _navButtonStyle = {
  backgroundColor: redTransparent,
  color: red,
  border: 'none',
  borderRadius: '4px',
  padding: '3px 6px',
  cursor: 'pointer',
};

const leftButtonStyle = {
  ..._navButtonStyle,
  borderTopRightRadius: '0px',
  borderBottomRightRadius: '0px',
  marginRight: '1px',
};

const rightButtonStyle = {
  ..._navButtonStyle,
  borderTopLeftRadius: '0px',
  borderBottomLeftRadius: '0px',
};

type Callback = () => void;

interface NavigationBarPropsType {
  readonly currentError: number;
  readonly totalErrors: number;
  readonly previous: Callback;
  readonly next: Callback;
}

export function NavigationBar(props: NavigationBarPropsType) {
  const { currentError, totalErrors, previous, next } = props;

  return (
    <div style={navigationBarStyle}>
      <span style={buttonContainerStyle}>
        <button onClick={previous} style={leftButtonStyle}>
          ←
        </button>
        <button onClick={next} style={rightButtonStyle}>
          →
        </button>
      </span>
      {`${currentError} of ${totalErrors} errors on the page`}
    </div>
  );
}
