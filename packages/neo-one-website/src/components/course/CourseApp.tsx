import { Loading } from '@neo-one/react-common';
import universal from 'react-universal-component';

export const CourseApp =
  // tslint:disable-next-line strict-type-predicates
  typeof window === 'undefined'
    ? Loading
    : universal(import('./App'), {
        loading: Loading,
        key: 'App',
      });
