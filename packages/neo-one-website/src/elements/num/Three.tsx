import { Image } from '@neo-one/react-common';
import * as React from 'react';
import three from '../../../static/img/number3.svg';

export const Three = (props: React.ComponentProps<typeof Image>) => <Image src={three} alt="03" {...props} />;
