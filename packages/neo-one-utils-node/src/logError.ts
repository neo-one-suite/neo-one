import execa from 'execa';
import P from 'pino';

// tslint:disable-next-line no-any
const isExecaError = (error: Error | execa.ExecaError): error is execa.ExecaError => (error as any).all !== undefined;

export const logError = (error: Error | execa.ExecaError, logger: P.Logger) => {
  logger.error({ err: isExecaError(error) ? `${error.message}\n${error.all}` : error });
};
