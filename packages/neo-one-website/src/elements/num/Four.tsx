import * as React from 'react';
import { Image } from 'reakit';
import four from '../../../static/img/number4.svg';
import { ComponentProps } from '../../types';

export const Four = (props: ComponentProps<typeof Image>) => <Image src={four} alt="04" {...props} />;
