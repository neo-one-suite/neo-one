import React, { Component } from 'react';

import logo from './logo.svg';
import './Main.css';

export default class Main extends Component {
  static contextTypes = {
    contracts: () => null,
  };

  state = {
    invoking: false,
    value: '',
    receipt: null,
  };

  _handleSubmit = event => {
    event.preventDefault();
    if (this.state.invoking) {
      return;
    }

    this.setState({ invoking: true });
    this.context.contracts.hello_world
      .hello(this.state.value)
      .then(result =>
        result.confirmed().then(receipt => {
          this.setState({ receipt, invoking: false });
        }),
      )
      .catch(error => {
        this.setState({ error, invoking: false });
      });
  };

  _handleChange = event => {
    this.setState({ value: event.target.value });
  };

  _renderEvents(events) {
    const eventElements = events.map((event, idx) => (
      // eslint-disable-next-line
      <div className="Main-event" key={idx}>
        <span className="Main-event-name">{event.name}:</span>
        {Object.keys(event.parameters)
          .sort()
          .map((name, innerIdx) => (
            // eslint-disable-next-line
            <span key={innerIdx} className="Main-event-name">
              {String(event.parameters[name])}
            </span>
          ))}
      </div>
    ));

    return (
      <div>
        <div>Events:</div>
        {eventElements}
      </div>
    );
  }

  _renderLogs(logs) {
    const logElements = logs.map((log, idx) => (
      // eslint-disable-next-line
      <div className="Main-event" key={idx}>
        {log.message}
      </div>
    ));

    return (
      <div>
        <div>Logs:</div>
        {logElements}
      </div>
    );
  }

  render() {
    const { invoking, receipt, error } = this.state;
    let receiptElement;
    if (!invoking && receipt != null) {
      receiptElement = (
        <div>
          <span>{receipt.result.value}</span>
          {this._renderEvents(receipt.events)}
          {this._renderLogs(receipt.logs)}
        </div>
      );
    }

    let errorElement;
    if (!invoking && error != null) {
      errorElement = (
        <div>
          <div>Something went wrong!</div>
          <div>{error.message}</div>
        </div>
      );
    }

    return (
      <div className="Main">
        <header className="Main-header">
          <img src={logo} className="Main-logo" alt="logo" />
          <h1 className="Main-title">Welcome to NEO•ONE</h1>
        </header>
        <p className="Main-intro">
          To get started developing a decentralized app, edit{' '}
          <code>src/Main.js</code> and save to reload.
        </p>
        <p className="Main-intro">
          Try out the Hello World smart contract below!
        </p>
        <form className="Main-invoke-form" onSubmit={this._handleSubmit}>
          <label htmlFor="invoke">
            Hello
            <input
              className="Main-invoke-input"
              id="invoke"
              type="text"
              value={this.state.value}
              onChange={this._handleChange}
            />
          </label>
          <input type="submit" value="Submit" disabled={this.state.invoking} />
        </form>
        {this.state.invoking ? <div>Invoking...</div> : null}
        {receiptElement}
        {errorElement}
      </div>
    );
  }
}
