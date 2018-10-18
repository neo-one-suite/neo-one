// tslint:disable no-any strict-type-predicates
import { theme } from '@neo-one/react-common';
import * as React from 'react';
import { hot } from 'react-hot-loader';
// @ts-ignore
import { Root, Routes } from 'react-static';
import { StyleSheetManager, ThemeProvider } from 'reakit';
// tslint:disable-next-line no-import-side-effect
import './app.css';

export const App = hot(module)(() => (
  <StyleSheetManager target={typeof document === 'undefined' || document.head === null ? undefined : document.head}>
    <ThemeProvider theme={theme}>
      <Root>
        <Routes />
      </Root>
    </ThemeProvider>
  </StyleSheetManager>
));
