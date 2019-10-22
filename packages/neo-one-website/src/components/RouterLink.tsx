import { Link } from '@reach/router';
import * as React from 'react';
// @ts-ignore
import { usePrefetch } from 'react-static';

interface RouterLinkProps {
  readonly to: string;
}

export const RouterLink = ({ to, ...props }: RouterLinkProps & React.ComponentProps<typeof Link>) => {
  const ref = usePrefetch(to);

  // tslint:disable-next-line no-any
  return <Link ref={ref as any} to={to} {...props} />;
};
