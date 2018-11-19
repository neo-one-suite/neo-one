import { Image } from '@neo-one/react-common';
import * as React from 'react';
import four from '../../../static/img/number4.svg';

export const Four = (props: React.ComponentProps<typeof Image>) => <Image src={four} alt="04" {...props} />;
