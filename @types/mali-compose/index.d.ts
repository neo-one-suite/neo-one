import { Middleware } from 'mali';

export default function compose(middlewares: ReadonlyArray<Middleware>): Middleware;
