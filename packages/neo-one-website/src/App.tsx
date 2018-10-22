// tslint:disable no-any strict-type-predicates
import { theme } from '@neo-one/react-common';
import * as React from 'react';
import { hot } from 'react-hot-loader';
// @ts-ignore
import { getCurrentRoutePath, Root, Routes } from 'react-static';
import { ThemeProvider } from 'reakit';
// tslint:disable-next-line no-import-side-effect
import './app.css';

const WebRoutes = () => (
  <Routes>
    {({ getComponentForPath }: any) => {
      const path = getCurrentRoutePath();
      const Comp = getComponentForPath(path);

      return Comp();
    }}
  </Routes>
);

const ReactRoutes: any = typeof window === 'undefined' ? Routes : WebRoutes;

export const App = hot(module)(() => (
  <ThemeProvider theme={theme}>
    <Root scrollToHashOffset={-88}>
      <ReactRoutes />
    </Root>
  </ThemeProvider>
));
