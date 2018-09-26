import * as React from 'react';
import { Image } from 'reakit';
import contract from '../../../static/img/contract.svg';
import { ComponentProps } from '../../types';

export const Contract = (props: ComponentProps<typeof Image>) => <Image src={contract} alt="05" {...props} />;
