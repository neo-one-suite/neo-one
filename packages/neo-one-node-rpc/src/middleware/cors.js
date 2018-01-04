/* @flow */
import convert from 'koa-convert';
import cors from 'koa-cors';

import { simpleMiddleware } from './common';

export default simpleMiddleware('cors', convert(cors({ origin: true })));
