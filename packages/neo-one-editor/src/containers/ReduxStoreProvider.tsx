import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

interface Props {
  readonly createStore: () => Store;
  readonly children: React.ReactNode;
}
export class ReduxStoreProvider extends React.Component<Props> {
  private readonly store: Store;

  public constructor(props: Props) {
    super(props);
    this.store = props.createStore();
  }

  public render() {
    return <Provider store={this.store}>{this.props.children}</Provider>;
  }
}
