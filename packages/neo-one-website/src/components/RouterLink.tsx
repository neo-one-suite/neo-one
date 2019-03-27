// tslint:disable no-any
import { Link } from '@reach/router';
import * as React from 'react';
import { Prefetch as ReactPrefetch } from 'react-static';

const Prefetch: any = ReactPrefetch;

interface Props {
  readonly to: string;
}

export class RouterLink extends React.Component<Props & React.ComponentProps<typeof Link>> {
  public render() {
    const { to, ...props } = this.props;

    return <Prefetch path={to}>{({ handleRef }: any) => <Link ref={handleRef} to={to} {...props} />}</Prefetch>;
  }
}
