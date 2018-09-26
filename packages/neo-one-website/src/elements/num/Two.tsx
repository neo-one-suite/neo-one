import * as React from 'react';
import { Image } from 'reakit';
import two from '../../../static/img/number2.svg';
import { ComponentProps } from '../../types';

export const Two = (props: ComponentProps<typeof Image>) => <Image src={two} alt="02" {...props} />;
