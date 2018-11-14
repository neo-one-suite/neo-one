import * as React from 'react';
import { Image } from 'reakit';
import three from '../../../static/img/number3.svg';
import { ComponentProps } from '../../types';

export const Three = (props: ComponentProps<typeof Image>) => <Image src={three} alt="03" {...props} />;
