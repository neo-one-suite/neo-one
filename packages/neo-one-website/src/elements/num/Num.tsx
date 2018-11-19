import { Image } from '@neo-one/react-common';
import * as React from 'react';
import { Five } from './Five';
import { Four } from './Four';
import { One } from './One';
import { Three } from './Three';
import { Two } from './Two';

// tslint:disable-next-line readonly-array
const numbers = [One, Two, Three, Four, Five];

interface Props {
  readonly num: number;
}

export const Num = ({ num, ...rest }: Props & React.ComponentProps<typeof Image>) => {
  const Component = numbers[num];

  return <Component {...rest} />;
};
