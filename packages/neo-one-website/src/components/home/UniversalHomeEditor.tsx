import { Loading } from '@neo-one/react-common';
import universal from 'react-universal-component';

// tslint:disable-next-line no-any
export const UniversalHomeEditor: any =
  // tslint:disable-next-line strict-type-predicates
  typeof window === 'undefined'
    ? Loading
    : universal(import('./HomeEditor'), {
        loading: Loading,
        key: 'HomeEditor',
        ignoreBabelRename: true,
      });
