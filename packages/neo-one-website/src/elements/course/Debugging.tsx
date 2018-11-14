import * as React from 'react';
import { Image } from 'reakit';
import debugging from '../../../static/img/debugging.svg';
import { ComponentProps } from '../../types';

export const Debugging = (props: ComponentProps<typeof Image>) => <Image src={debugging} alt="05" {...props} />;
