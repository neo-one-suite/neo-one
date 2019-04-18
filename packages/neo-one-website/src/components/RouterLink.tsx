import { Link } from '@reach/router';
import * as React from 'react';
// @ts-ignore
import { usePrefetch } from 'react-static';

interface RouterLinkProps {
  readonly to: string;
}

export const RouterLink = ({ to, ...props }: RouterLinkProps & React.ComponentProps<typeof Link>) => {
  const ref = usePrefetch(to);

  return <Link ref={ref} to={to} {...props} />;
};
