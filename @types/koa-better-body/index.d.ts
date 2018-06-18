import Koa from 'koa';

type Body = (ctx: Koa.Context, next: () => void) => Generator;
export default function(options: {
  textLimit: string;
  formLimit: string;
  jsonLimit: string;
  bufferLimit: string;
}): Body;
