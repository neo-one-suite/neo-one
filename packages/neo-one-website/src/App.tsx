import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'reakit';
import { ScrollToTop } from './components';
import { CoreLayout } from './layout';
import { Home, Tutorial } from './pages';
import { theme } from './theme';

export const App = hot(module)(() => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <ScrollToTop>
        <Switch>
          <CoreLayout>
            <Route exact path="/" component={Home} />
            <Route exact path="/tutorial" component={Tutorial} />
          </CoreLayout>
        </Switch>
      </ScrollToTop>
    </BrowserRouter>
  </ThemeProvider>
));
