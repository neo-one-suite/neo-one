import { theme } from '@neo-one/react-common';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ThemeProvider } from 'reakit';
import { StyleSheetManager } from 'styled-components';
// @ts-ignore
import { ContractsProvider, DeveloperTools } from '../one/generated';
import { Info } from './Info';

const App = (
  <StyleSheetManager target={document.head === null ? undefined : document.head}>
    <ThemeProvider theme={theme}>
      <ContractsProvider>
        <Info />
        <DeveloperTools />
      </ContractsProvider>
    </ThemeProvider>
  </StyleSheetManager>
);

ReactDOM.render(App, document.getElementById('app'));
