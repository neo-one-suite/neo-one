// tslint:disable no-any strict-type-predicates
import { theme } from '@neo-one/react-common';
import * as React from 'react';
import { hot } from 'react-hot-loader';
// @ts-ignore
import { Root, Routes } from 'react-static';
import { ThemeProvider } from 'reakit';
// tslint:disable-next-line no-import-side-effect
import './app.css';

export const App = hot(module)(() => (
  <ThemeProvider theme={theme}>
    <Root>
      <Routes />
    </Root>
  </ThemeProvider>
));
