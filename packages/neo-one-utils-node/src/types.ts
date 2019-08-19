import yargs from 'yargs';

// tslint:disable-next-line no-any
export type Yarguments<Argv extends yargs.Argv<any>> = yargs.Arguments<
  Argv extends yargs.Argv<infer Value> ? Value : never
>;
