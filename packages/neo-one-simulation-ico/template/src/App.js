/* @flow */
import { type HOC, compose, lifecycle, pure, withContext, withProps } from 'recompose';
import * as React from 'react';
import CssBaseline from 'material-ui/CssBaseline';

import ICO from './ico';
import Tour from './tour';

import { getClient, setupClient, getContracts } from './client';

const client = getClient();

type ExternalProps = {||};
type InternalProps = {||};
type Props = {|
  ...ExternalProps,
  ...InternalProps,
|};

// eslint-disable-next-line
function App(props: Props): React.Element<*> {
  return (
    <div>
      <CssBaseline />
      <ICO />
      <Tour />
    </div>
  );
}

const enhance: HOC<*, *> = compose(
  withProps(() => ({ coinContract: getContracts(client).ico })),
  lifecycle({
    componentDidMount() {
      setupClient(client);
    },
  }),
  withContext({ client: () => null, coinContract: () => null }, ({ coinContract }) => ({ client, coinContract })),
  pure,
);

export default (enhance(App): React.ComponentType<ExternalProps>);
