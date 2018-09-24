import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { injectGlobal, ThemeProvider } from 'reakit';
import { ScrollToTop } from './components';
import { Home, Interactive } from './pages';
import { theme } from './theme';

// tslint:disable-next-line:no-unused-expression
injectGlobal`
  body {
    margin: 0;
    background-color: #2E2837;
  }
`;

export const App = hot(module)(() => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <ScrollToTop>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/interactive" component={Interactive} />
        </Switch>
      </ScrollToTop>
    </BrowserRouter>
  </ThemeProvider>
));
