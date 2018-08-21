import {
  CRUDBase,
  CRUDResource,
  CRUDResourceBase,
  DeleteCRUD,
  DescribeCRUD,
  GetCRUD,
  handleCLITaskList,
  InteractiveCLI,
  Plugin,
} from '@neo-one/server-plugin';
import logUpdate from 'log-update';
import { EMPTY, ReplaySubject } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
// tslint:disable-next-line match-default-export-name
import { Command } from 'vorpal';

const addCommonResource = ({
  cli,
  command,
  crud,
}: {
  readonly cli: InteractiveCLI;
  readonly command: Command;
  readonly crud: CRUDResourceBase;
}) => {
  command.autocomplete({
    data: async () => crud.getCLIAutocomplete({ cli }),
  });
};

const addCommon = ({ command, crud }: { readonly command: Command; readonly crud: CRUDBase }) => {
  crud.options.forEach(({ option, description }) => {
    command.option(option, description);
  });

  crud.aliases.forEach((alias) => {
    command.alias(alias);
  });
};

const promptDelete = async ({
  cli,
  crud,
  name,
}: {
  readonly cli: InteractiveCLI;
  readonly crud: CRUDResource;
  readonly name: string;
}) =>
  cli.prompt([
    {
      type: 'confirm',
      name: 'continue',
      default: false,
      message: `Are you sure you want to delete ${crud.resourceType.name} ${name}?`,
    },
  ]);

const createResource = ({ cli, crud }: { readonly cli: InteractiveCLI; readonly crud: CRUDResource }) => {
  let cancel$ = new ReplaySubject<void>();
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('--no-progress', "Don't output progress. Typically used for CI scenarios")
    .action(async (args) => {
      cancel$ = new ReplaySubject<void>();

      if (crud instanceof DeleteCRUD && !args.options.force) {
        const response = await promptDelete({
          cli,
          crud,
          name: args.name,
        });

        if (!response.continue) {
          cli.vorpal.activeCommand.log('Aborting...');

          return;
        }
      }

      const options = await crud.getCLIResourceOptions({
        cli,
        args,
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

      const progress = args.options.progress === undefined || args.options.progress;
      if (!progress) {
        cli.print(`${crud.names.ingUpper} ${name}...`);
      }

      await crud.preExecCLI({ name, cli, options });

      await handleCLITaskList({
        cli,
        response$,
        progress,
        cancel$,
      });

      await crud.postExecCLI({ name, cli, options });
    })
    .cancel(() => {
      cancel$.next();
    });

  addCommon({ command, crud });
  addCommonResource({ cli, command, crud });

  if (crud instanceof DeleteCRUD) {
    command.option('--force', 'Delete without prompting');
  }

  return command;
};
const createGet = ({ cli, crud }: { readonly cli: InteractiveCLI; readonly crud: GetCRUD }) => {
  let cancel$ = new ReplaySubject<string>();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async (args) => {
      const options = await crud.getCLIResourceOptions({
        cli,
        args,
        options: args.options,
      });

      const resources$ = crud.getResources$({ client: cli.client, options }).pipe(
        map((resources) => {
          const table = resourceType.getListTable(resources);
          if (args.options.json) {
            cli.vorpal.activeCommand.log(JSON.stringify(resources));
          } else {
            cli.printList(table, logUpdate);
          }
        }),
      );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(switchMap((event) => (event === 'cancel' ? EMPTY : resources$)));

      await crud.preExecCLI({ cli, options });

      if (args.options.watch) {
        await print$.toPromise();
      } else {
        await print$.pipe(take(1)).toPromise();
      }

      await crud.postExecCLI({ cli, options });

      logUpdate.done();
    })
    .cancel(() => {
      cancel$.next('cancel');
      cancel$.complete();
    });

  addCommon({ command, crud });

  return command;
};
const createDescribe = ({ cli, crud }: { readonly cli: InteractiveCLI; readonly crud: DescribeCRUD }) => {
  let cancel$ = new ReplaySubject<string>();
  const { resourceType } = crud;
  const command = cli.vorpal
    .command(crud.command, crud.help)
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async (args) => {
      const options = await crud.getCLIResourceOptions({
        cli,
        args,
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
          map((resource) => {
            if (resource === undefined) {
              throw new Error(`${resourceType.names.capital} ${args.name} does not exist`);
            }
            const table = resourceType.getDescribeTable(resource);
            if (args.options.json) {
              cli.vorpal.activeCommand.log(JSON.stringify(resource));
            } else {
              cli.printDescribe(table, logUpdate);
            }
          }),
        );

      cancel$ = new ReplaySubject();
      cancel$.next('start');
      const print$ = cancel$.pipe(switchMap((event) => (event === 'cancel' ? EMPTY : resource$)));

      await crud.preExecCLI({ name, cli, options });

      if (args.options.watch) {
        await print$.toPromise();
      } else {
        await print$.pipe(take(1)).toPromise();
      }

      await crud.postExecCLI({ name, cli, options });

      logUpdate.done();
    })
    .cancel(() => {
      cancel$.next('cancel');
      cancel$.complete();
    });

  addCommon({ command, crud });
  addCommonResource({ cli, command, crud });

  return command;
};

export const createCRUD = ({ cli, plugin }: { readonly cli: InteractiveCLI; readonly plugin: Plugin }) => {
  const mutableCommands: Command[] = [];
  plugin.resourceTypes.forEach((resourceType) => {
    const crud = resourceType.getCRUD();
    if (!crud.create.hidden) {
      mutableCommands.push(createResource({ cli, crud: crud.create }));
    }
    if (!crud.delete.hidden) {
      mutableCommands.push(createResource({ cli, crud: crud.delete }));
    }
    if (crud.start !== undefined && !crud.start.hidden) {
      mutableCommands.push(createResource({ cli, crud: crud.start }));
    }
    if (crud.stop !== undefined && !crud.stop.hidden) {
      mutableCommands.push(createResource({ cli, crud: crud.stop }));
    }
    if (!crud.get.hidden) {
      mutableCommands.push(createGet({ cli, crud: crud.get }));
    }
    if (!crud.describe.hidden) {
      mutableCommands.push(createDescribe({ cli, crud: crud.describe }));
    }
  });

  return mutableCommands;
};
