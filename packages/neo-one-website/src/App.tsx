// tslint:disable no-any strict-type-predicates
import { theme } from '@neo-one/react-common';
// @ts-ignore
import { ViewportProvider } from '@render-props/viewport';
import * as React from 'react';
import { hot } from 'react-hot-loader';
// @ts-ignore
import { getCurrentRoutePath, Root, Routes } from 'react-static';
import { ThemeProvider } from 'reakit';
import { CourseLoading, HomeLoading } from './layout';

const WebRoutes = (props: any) => (
  <Routes {...props}>
    {({ getComponentForPath }: any) => {
      const path = getCurrentRoutePath();
      const Comp = getComponentForPath(path);
      if (Comp === HomeLoading && path.startsWith('course')) {
        return CourseLoading();
      }

      return Comp();
    }}
  </Routes>
);

const ReactRoutes: any = typeof window === 'undefined' ? Routes : WebRoutes;

export const App = hot(module)(() => (
  <ThemeProvider theme={theme}>
    <ViewportProvider>
      <Root scrollToHashOffset={-88}>
        <ReactRoutes Loader={HomeLoading} />
      </Root>
    </ViewportProvider>
  </ThemeProvider>
));
