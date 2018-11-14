import * as React from 'react';
import { Image } from 'reakit';
import five from '../../../static/img/number5.svg';
import { ComponentProps } from '../../types';

export const Five = (props: ComponentProps<typeof Image>) => <Image src={five} alt="05" {...props} />;
