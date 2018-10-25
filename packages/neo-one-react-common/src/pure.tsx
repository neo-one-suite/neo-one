// tslint:disable no-any strict-boolean-expressions
import * as React from 'react';
import { shallowEqual } from './shallowEqual';

const getDisplayName = (Component: any) => {
  if (typeof Component === 'string') {
    return Component;
  }

  if (!Component) {
    return undefined;
  }

  return Component.displayName || Component.name || 'Component';
};

export function pure<P>(BaseComponent: React.ComponentType<P>): React.ComponentClass<P> {
  const factory = React.createFactory<P>(BaseComponent as any);

  class Pure extends React.Component<P> {
    public shouldComponentUpdate(nextProps: P) {
      return !shallowEqual(this.props, nextProps);
    }

    public render() {
      return factory(this.props);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // tslint:disable no-object-mutation
    // @ts-ignore
    Pure.displayName = `Pure(${getDisplayName(BaseComponent)})`;
    // tslint:enable no-object-mutation
  }

  return Pure;
}
