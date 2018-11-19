import { Image } from '@neo-one/react-common';
import * as React from 'react';
import five from '../../../static/img/number5.svg';

export const Five = (props: React.ComponentProps<typeof Image>) => <Image src={five} alt="05" {...props} />;
