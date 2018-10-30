import ResizeObserver from 'resize-observer-polyfill';
import { applyStyles } from './css';
import { DeveloperToolsOptions, DeveloperToolsOptionsInternal } from './types';

// Importing iframe-bundle generated in the pre build step as
// a text using webpack raw-loader.
// @ts-ignore
import iframeScript from 'raw-loader!../../../dist/tools/tools.js'; // tslint:disable-line:no-implicit-dependencies no-submodule-imports
import { getStatics } from './getStatics';
import { getSize } from './utils';

// tslint:disable no-let
let iframeElement: HTMLIFrameElement | undefined;
let iframeWindow: Window | undefined;
let created = false;
let initialized = false;
let devToolsOptions: DeveloperToolsOptionsInternal | undefined;

const updateOptions = (options: DeveloperToolsOptionsInternal) => {
  devToolsOptions = options;
  if (created && initialized && iframeWindow !== undefined) {
    // tslint:disable-next-line no-any
    (iframeWindow as any).updateOptions(options);
  }
};

const doRefreshOptions = () => {
  if (devToolsOptions !== undefined) {
    updateOptions(createOptions(devToolsOptions));
  }
};

let refreshOptionsTimeout: number | undefined;

const clearRefreshOptionsTimeout = () => {
  if (refreshOptionsTimeout !== undefined) {
    clearTimeout(refreshOptionsTimeout);
    refreshOptionsTimeout = undefined;
  }
};

const refreshOptions = () => {
  clearRefreshOptionsTimeout();
  // tslint:disable-next-line no-any
  refreshOptionsTimeout = setTimeout(doRefreshOptions, 100) as any;
};

const resizeObserver = new ResizeObserver(refreshOptions);

const BASE_STYLES = {
  position: 'fixed',
  bottom: '0',
  left: '0',
  width: '40px',
  height: '40px',
  border: 'none',
  'z-index': 2147483647,
};

let lastWidth: string | undefined;
let lastHeight: string | undefined;

const createOptions = (options: DeveloperToolsOptions): DeveloperToolsOptionsInternal => ({
  ...options,
  maxWidth: getSize().width,
  onResize: ({ width, height }) => {
    if (iframeElement !== undefined && lastWidth !== width && lastHeight !== height) {
      lastWidth = width;
      lastHeight = height;
      applyStyles(iframeElement, { ...BASE_STYLES, width, height });
    }
  },
});

const enable = (options: DeveloperToolsOptions) => {
  updateOptions(createOptions(options));
  if (created) {
    return;
  }
  created = true;

  // tslint:disable-next-line strict-type-predicates
  if (typeof window === 'undefined') {
    return;
  }

  const iframe = window.document.createElement('iframe');
  iframeElement = iframe;
  applyStyles(iframe, BASE_STYLES);
  // tslint:disable-next-line no-object-mutation
  iframe.onload = () => {
    const iframeDocument = iframe.contentDocument;
    const maybeIFrameWindow = iframe.contentWindow;
    if (iframeDocument !== null && maybeIFrameWindow !== null) {
      iframeWindow = maybeIFrameWindow;
      const script = iframeWindow.document.createElement('script');
      // tslint:disable-next-line no-object-mutation
      script.type = 'text/javascript';
      // tslint:disable-next-line no-object-mutation
      script.innerHTML = iframeScript;
      iframeDocument.body.append(script);
    }
  };
  // tslint:disable-next-line no-object-mutation no-any
  (window as any).__NEO_ONE_DEVELOPER_TOOLS__ = {
    initialize: () => {
      initialized = true;

      return devToolsOptions;
    },
  };
  window.document.body.append(iframe);
  resizeObserver.observe(getStatics().docEl);
};

export const DeveloperToolsDev = { enable };
