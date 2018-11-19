// tslint:disable no-any
import { Link } from '@reach/router';
import * as React from 'react';
import { Prefetch as ReactPrefetch } from 'react-static';

const Prefetch: any = ReactPrefetch;

interface Props {
  readonly to: string;
}

export const RouterLink = ({ to, ...props }: Props & React.ComponentProps<typeof Link>) => (
  <Prefetch path={to}>{({ handleRef }: any) => <Link ref={handleRef} to={to} {...props} />}</Prefetch>
);
