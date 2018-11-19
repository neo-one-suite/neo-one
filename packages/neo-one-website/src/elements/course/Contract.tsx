import { Image } from '@neo-one/react-common';
import * as React from 'react';
import contract from '../../../static/img/contract.svg';

export const Contract = (props: React.ComponentProps<typeof Image>) => <Image src={contract} alt="05" {...props} />;
