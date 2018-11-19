import { Image } from '@neo-one/react-common';
import * as React from 'react';
import two from '../../../static/img/number2.svg';

export const Two = (props: React.ComponentProps<typeof Image>) => <Image src={two} alt="02" {...props} />;
