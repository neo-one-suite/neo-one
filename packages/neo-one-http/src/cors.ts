import convert from 'koa-convert';
import koaCors from 'koa-cors';

export const cors: ReturnType<typeof convert> = convert(koaCors({ origin: '*' }));
