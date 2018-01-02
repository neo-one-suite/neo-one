/* @flow */
import { type HOC, compose, pure } from 'recompose';
import * as React from 'react';

import { withStyles } from 'material-ui';

// eslint-disable-next-line
const styles = theme => ({});

type ExternalProps = {|
  className?: string,
|};
type InternalProps = {|
  classes: Object,
|};
type Props = {|
  ...ExternalProps,
  ...InternalProps,
|};
function Tour({
  className,
  // eslint-disable-next-line
  classes,
}: Props): React.Element<*> {
  return (
    // eslint-disable-next-line
    <div className={className} />
  );
}

const enhance: HOC<*, *> = compose(withStyles(styles), pure);

export default (enhance(Tour): React.ComponentType<ExternalProps>);
