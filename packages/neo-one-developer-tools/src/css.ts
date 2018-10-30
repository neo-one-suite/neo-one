// tslint:disable no-object-mutation

// tslint:disable-next-line export-name
export function applyStyles(element: HTMLElement, styles: object) {
  element.setAttribute('style', '');
  // tslint:disable-next-line no-loop-statement
  for (const [key, val] of Object.entries(styles)) {
    // @ts-ignore
    element.style[key] = val;
  }
}
