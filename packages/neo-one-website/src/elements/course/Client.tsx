import * as React from 'react';
import { Image } from 'reakit';
import client from '../../../static/img/client.svg';
import { ComponentProps } from '../../types';

export const Client = (props: ComponentProps<typeof Image>) => <Image src={client} alt="05" {...props} />;
