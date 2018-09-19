import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

class ScrollToTopBase extends React.Component<RouteComponentProps> {
  public componentDidUpdate(prevProps: RouteComponentProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  public render() {
    return this.props.children;
  }
}

export const ScrollToTop = withRouter(ScrollToTopBase);
