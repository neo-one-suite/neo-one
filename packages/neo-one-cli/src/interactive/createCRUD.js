/* @flow */
// flowlint untyped-import:off
import type { Command } from 'vorpal';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import {
  type CRUDBase,
  type CRUDResource,
  type CRUDResourceBase,
  type DescribeCRUD,
  type GetCRUD,
  type Plugin,
} from '@neo-one/server';

import { concatMap, filter, map, switchMap, take } from 'rxjs/operators';
import { defer } from 'rxjs/observable/defer';
import { empty } from 'rxjs/observable/empty';
import logUpdate from 'log-update';
import ora from 'ora';

import type InteractiveCLI from '../InteractiveCLI';

const addCommonResource = ({
  cli,
  command,
  crud,
}: {|
  cli: InteractiveCLI,
  command: Command,
  crud: CRUDResourceBase<*, *>,
|}) => {
  command.autocomplete({
    data: async () => crud.getCLIAutocomplete({ cli }),
  });
};

const addCommon = ({
  command,
  crud,
}: {|
  command: Command,
  crud: CRUDBase<*, *>,
|}) => {
  crud.options.forEach(({ option, description }) => {
    command.option(option, description);
  });

  crud.aliases.forEach(alias => {
    command.alias(alias);
  });
};

const fail = (message: string) => ora(message).fail();

const createResource = ({
  cli,
  crud,
}: {|
  cli: InteractiveCLI,
  crud: CRUDResource<*, *>,
|}) => {
  let cancel$ = new ReplaySubject();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .action(async args => {
      let spinner;
      let resource;
      cancel$ = new ReplaySubject();

      try {
        const options = await crud.getCLIResourceOptions({
          cli,
          options: args.options,
        });
        const name = await crud.getCLIName({
          baseName: args.name,
          cli,
          options,
        });

        const response$ = crud.request$({
          name,
          cancel$,
          options,
          client: cli.client,
        });

        await crud.preExecCLI({ name, cli, options });

        await response$
          .pipe(
            concatMap(event =>
              defer(async () => {
                switch (event.type) {
                  case 'done':
                    if (spinner != null) {
                      spinner.stop();
                    }
                    cancel$.complete();
                    if (crud.name === 'create') {
                      resource = await resourceType
                        .getResource$({
                          name,
                          client: cli.client,
                          options,
                        })
                        .pipe(filter(value => value != null), take(1))
                        .toPromise();
                      if (resource != null) {
                        cli.printDescribe(
                          resourceType.getDescribeTable(resource),
                        );
                      }
                    }
                    break;
                  case 'progress':
                    if (spinner == null) {
                      spinner = ora();
                    }

                    if (event.persist) {
                      spinner.succeed(event.message);
                      spinner = null;
                    } else {
                      spinner.start(event.message);
                    }
                    break;
                  case 'error':
                    if (spinner != null) {
                      spinner.fail();
                      spinner = null;
                    }
                    cancel$.complete();
                    throw new Error(event.message);
                  case 'aborted':
                    if (spinner != null) {
                      spinner.fail();
                      spinner = null;
                    }
                    cancel$.complete();

                    throw new Error('Aborted');
                  default:
                    // eslint-disable-next-line
                    (event.type: empty);
                }
              }),
            ),
          )
          .toPromise();

        await crud.postExecCLI({ name, cli, options });
      } catch (error) {
        if (spinner != null) {
          spinner.fail();
        }
        throw error;
      }
    })
    .cancel(() => {
      cancel$.next();
    });

  addCommon({ command, crud });
  addCommonResource({ cli, command, crud });

  return command;
};

const createGet = ({
  cli,
  crud,
}: {|
  cli: InteractiveCLI,
  crud: GetCRUD<*, *>,
|}) => {
  let cancel$ = new ReplaySubject();
  const { resourceType } = crud;
  const log = logUpdate.create(process.stdout);
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .action(async args => {
      const options = await crud.getCLIResourceOptions({
        cli,
        options: args.options,
      });

      const resources$ = crud
        .getResources$({ client: cli.client, options })
        .pipe(
          map(resources =>
            cli.printList(resourceType.getListTable(resources), log),
          ),
        );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(
        switchMap(event => (event === 'cancel' ? empty() : resources$)),
      );

      await crud.preExecCLI({ cli, options });

      if (args.options.watch) {
        await print$.toPromise();
      } else {
        await print$.pipe(take(1)).toPromise();
      }

      await crud.postExecCLI({ cli, options });

      log.done();
    })
    .cancel(() => {
      cancel$.next('cancel');
      cancel$.complete();
    });

  addCommon({ command, crud });

  return command;
};

const createDescribe = ({
  cli,
  crud,
}: {|
  cli: InteractiveCLI,
  crud: DescribeCRUD<*, *>,
|}) => {
  let cancel$ = new ReplaySubject();
  const { resourceType } = crud;
  const log = logUpdate.create(process.stdout);
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .action(async args => {
      const options = await crud.getCLIResourceOptions({
        cli,
        options: args.options,
      });
      const name = await crud.getCLIName({
        baseName: args.name,
        cli,
        options,
      });

      const resource$ = resourceType
        .getResource$({
          name,
          client: cli.client,
          options,
        })
        .pipe(
          map(resource => {
            if (resource == null) {
              fail(`${resourceType.names.capital} ${args.name} does not exist`);
            } else {
              cli.printDescribe(resourceType.getDescribeTable(resource), log);
            }
          }),
        );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(
        switchMap(event => (event === 'cancel' ? empty() : resource$)),
      );

      await crud.preExecCLI({ name, cli, options });

      if (args.options.watch) {
        await print$.toPromise();
      } else {
        await print$.pipe(take(1)).toPromise();
      }

      await crud.postExecCLI({ name, cli, options });

      log.done();
    })
    .cancel(() => {
      cancel$.next('cancel');
      cancel$.complete();
    });

  addCommon({ command, crud });
  addCommonResource({ cli, command, crud });

  return command;
};

export default ({ cli, plugin }: {| cli: InteractiveCLI, plugin: Plugin |}) => {
  const commands = [];
  for (const resourceType of plugin.resourceTypes) {
    const crud = resourceType.getCRUD();
    commands.push(createResource({ cli, crud: crud.create }));
    commands.push(createResource({ cli, crud: crud.delete }));
    commands.push(createResource({ cli, crud: crud.start }));
    commands.push(createResource({ cli, crud: crud.stop }));
    commands.push(createGet({ cli, crud: crud.get }));
    commands.push(createDescribe({ cli, crud: crud.describe }));
  }

  return commands;
};
