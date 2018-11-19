import { Image } from '@neo-one/react-common';
import * as React from 'react';
import debugging from '../../../static/img/debugging.svg';

export const Debugging = (props: React.ComponentProps<typeof Image>) => <Image src={debugging} alt="05" {...props} />;
