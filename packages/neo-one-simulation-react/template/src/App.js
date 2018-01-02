import React, { Component } from 'react';

import Main from './Main';

import { getClient, setupClient, getContracts } from './client';

const client = getClient();

export default class App extends Component {
  static childContextTypes = {
    client: () => null,
    contracts: () => null,
  };

  getChildContext() {
    return { client, contracts: this.state.contracts };
  }

  componentWillMount() {
    this.setState({
      contracts: getContracts(client),
    });
  }

  componentDidMount() {
    setupClient(client);
  }

  render() {
    return <Main />;
  }
}
