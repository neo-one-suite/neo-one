import universal from 'react-universal-component';
import { Loading } from './Loading';

export const CourseApp =
  // tslint:disable-next-line strict-type-predicates
  typeof window === 'undefined'
    ? Loading
    : universal(import('./App'), {
        loading: Loading,
        key: 'App',
      });
