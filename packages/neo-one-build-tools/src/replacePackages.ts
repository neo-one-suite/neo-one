import * as fs from 'fs-extra';
import * as path from 'path';

const playgroundPackagesPath = path.resolve('neo-one-playground', 'node_modules', '@neo-one');
const distPackagesPath = path.resolve('packages');
const exceptions: readonly string[] = [
  'ec-key',
  'local',
  'monitor',
  'node-data-backup',
  'server',
  'server-client',
  'server-plugin',
  'server-grpc',
  'server-http-client',
  'server-plugin-neotracker',
  'server-plugin-network',
  'server-plugin-project',
  'server-plugin-wallet',
];

const getInstallPackageName = (name: string) => name.slice(8);
const pruneExceptions = (modules: readonly string[], exceptionsIn: readonly string[]) =>
  modules.filter((mod) => !exceptionsIn.includes(mod));
const deleteModules = (modules: readonly string[]) => {
  modules.forEach((dir) => fs.removeSync(path.resolve(playgroundPackagesPath, dir)));
};
const copyModules = (modules: readonly string[]) => {
  modules.forEach((mod) => {
    try {
      fs.copySync(
        path.resolve(distPackagesPath, mod, 'lib'),
        path.resolve(playgroundPackagesPath, getInstallPackageName(mod)),
      );
    } catch (error) {
      // tslint:disable-next-line: no-console
      console.error(error);
    }
  });
};

const modulesRead = fs.readdirSync(playgroundPackagesPath);
const prunedModules = pruneExceptions(modulesRead, exceptions);
const modulesToGet = prunedModules.map((mod) => `neo-one-${mod}`);

deleteModules(prunedModules);
copyModules(modulesToGet);
