// tslint:disable no-any strict-type-predicates
import { GlobalFonts, theme } from '@neo-one/react-common';
// @ts-ignore
import { ViewportProvider } from '@render-props/viewport';
import { ThemeProvider } from 'emotion-theming';
import React from 'react';
import { hot } from 'react-hot-loader';
import { Root, Routes } from 'react-static';
import { HomeLoading } from './layout';

const { Suspense } = React;

export const App = hot(module)(() => (
  <>
    <GlobalFonts />
    <ThemeProvider theme={theme}>
      <ViewportProvider>
        <Suspense fallback={<HomeLoading />}>
          <Root>
            {/*
            // @ts-ignore */}
            <Routes />
          </Root>
        </Suspense>
      </ViewportProvider>
    </ThemeProvider>
  </>
));
