import convert from 'koa-convert';
import koaCors from 'koa-cors';

export const cors = convert(koaCors({ origin: true }));
