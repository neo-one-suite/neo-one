import * as React from 'react';
import { Image } from 'reakit';
import one from '../../../static/img/number1.svg';
import { ComponentProps } from '../../types';

export const One = (props: ComponentProps<typeof Image>) => <Image src={one} alt="01" {...props} />;
