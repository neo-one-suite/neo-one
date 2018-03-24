/* @flow */
import convert from 'koa-convert';
import cors from 'koa-cors';

export default convert(cors({ origin: true }));
