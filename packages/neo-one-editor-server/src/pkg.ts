import { lambda } from './lambda';
import { pkgMiddleware } from './pkgMiddleware';

// tslint:disable-next-line:no-default-export export-name
export default lambda('pkg', pkgMiddleware, 'get');
