/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* @flow */
const black = '#293238';
const darkGray = '#878e91';
const red = '#ce1126';
const redTransparent = 'rgba(206, 17, 38, 0.05)';
const lightRed = '#fccfcf';
const yellow = '#fbf5b4';
const yellowTransparent = 'rgba(251, 245, 180, 0.3)';
const white = '#ffffff';

const iframeStyle = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  border: 'none',
  'z-index': 2147483647,
};

const overlayStyle = {
  width: '100%',
  height: '100%',
  'box-sizing': 'border-box',
  'text-align': 'center',
  'background-color': white,
};

const primaryErrorStyle = {
  'background-color': lightRed,
};

const secondaryErrorStyle = {
  'background-color': yellow,
};

export {
  iframeStyle,
  overlayStyle,
  primaryErrorStyle,
  secondaryErrorStyle,
  black,
  darkGray,
  red,
  redTransparent,
  yellowTransparent,
};
