import { lambda } from './lambda';
import { resolveMiddleware } from './resolveMiddleware';

// tslint:disable-next-line:no-default-export export-name
export default lambda('resolve', resolveMiddleware, 'post');
