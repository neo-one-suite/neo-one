import * as React from 'react';

export class Pure extends React.Component {
  public shouldComponentUpdate() {
    return false;
  }

  public render() {
    return this.props.children;
  }
}
