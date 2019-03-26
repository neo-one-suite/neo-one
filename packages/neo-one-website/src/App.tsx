// tslint:disable no-any strict-type-predicates
import { GlobalFonts, theme } from '@neo-one/react-common';
// @ts-ignore
import { ViewportProvider } from '@render-props/viewport';
import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Root, Routes } from 'react-static';
import { ThemeProvider } from 'styled-components';
import { HomeLoading } from './layout';

const ReactRoutes: any = Routes;

export const App = hot(module)(() => (
  <>
    <GlobalFonts />
    <ThemeProvider theme={theme}>
      <ViewportProvider>
        <Root scrollToHashOffset={-88}>
          <ReactRoutes Loader={HomeLoading} />
        </Root>
      </ViewportProvider>
    </ThemeProvider>
  </>
));
