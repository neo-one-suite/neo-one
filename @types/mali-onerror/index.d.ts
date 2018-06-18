import { Context, Middleware } from 'mali';
export default function onError(cb: (error: Error, ctx: Context) => void): Middleware;
