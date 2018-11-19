import { Image } from '@neo-one/react-common';
import * as React from 'react';
import one from '../../../static/img/number1.svg';

export const One = (props: React.ComponentProps<typeof Image>) => <Image src={one} alt="01" {...props} />;
