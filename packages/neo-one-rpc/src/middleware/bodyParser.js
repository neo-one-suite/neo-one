/* @flow */
import body from 'koa-better-body';
import convert from 'koa-convert';

export default () => convert(body());
