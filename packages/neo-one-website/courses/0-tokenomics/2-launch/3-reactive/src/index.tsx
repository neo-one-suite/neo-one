// tslint:disable-next-line
import { theme } from '@neo-one/react-common';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ThemeProvider } from 'reakit';
// @ts-ignore
import { ContractsProvider } from '../one/generated';
import { ICO } from './ICO';

const App = (
  <ThemeProvider theme={theme}>
    <ContractsProvider>
      <ICO />
    </ContractsProvider>
  </ThemeProvider>
);

ReactDOM.render(App, document.getElementById('app'));
