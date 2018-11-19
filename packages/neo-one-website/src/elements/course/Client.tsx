import { Image } from '@neo-one/react-common';
import * as React from 'react';
import client from '../../../static/img/client.svg';

export const Client = (props: React.ComponentProps<typeof Image>) => <Image src={client} alt="05" {...props} />;
