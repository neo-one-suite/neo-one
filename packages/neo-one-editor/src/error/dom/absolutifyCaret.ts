/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// tslint:disable
function removeNextBr(parent: any, component: Element | undefined) {
  while (component != null && component.tagName.toLowerCase() !== 'br') {
    // @ts-ignore
    component = component.nextElementSibling;
  }
  if (component != null) {
    parent.removeChild(component);
  }
}

function absolutifyCaret(component: Node) {
  const ccn = component.childNodes;
  for (let index = 0; index < ccn.length; ++index) {
    const c = ccn[index];
    // @ts-ignore
    if (c.tagName.toLowerCase() !== 'span') {
      continue;
    }
    // @ts-ignore
    const _text = c.innerText;
    if (_text == null) {
      continue;
    }
    const text = _text.replace(/\s/g, '');
    if (text !== '|^') {
      continue;
    }
    // @ts-ignore
    c.style.position = 'absolute';
    // @ts-ignore
    removeNextBr(component, c);
  }
}

export { absolutifyCaret };
