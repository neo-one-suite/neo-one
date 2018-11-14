import { Loading } from '@neo-one/react-common';
import universal from 'react-universal-component';

// tslint:disable-next-line no-any
export const CourseApp: any =
  // tslint:disable-next-line strict-type-predicates
  typeof window === 'undefined'
    ? Loading
    : universal(import('./App'), {
        loading: Loading,
        key: 'App',
      });
