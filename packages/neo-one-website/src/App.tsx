// tslint:disable no-any
import { theme } from '@neo-one/react';
import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Router } from 'react-static';
import Routes from 'react-static-routes';
import { StyleSheetManager, ThemeProvider } from 'reakit';
// tslint:disable-next-line no-import-side-effect
import './app.css';

export const App = hot(module)(() => (
  <StyleSheetManager target={document.head === null ? undefined : document.head}>
    <ThemeProvider theme={theme}>
      <Router>
        <Routes />
      </Router>
    </ThemeProvider>
  </StyleSheetManager>
));
