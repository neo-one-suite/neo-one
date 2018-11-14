import * as React from 'react';
import { Image } from 'reakit';
import { ComponentProps } from '../../types';
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

export const Num = ({ num, ...rest }: Props & ComponentProps<typeof Image>) => {
  const Component = numbers[num];

  return <Component {...rest} />;
};
