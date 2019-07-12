import * as fs from 'fs-extra';
import * as path from 'path';

const playgroundPackagesPath: string = path.resolve('neo-one-playground', 'node_modules', '@neo-one');
const distPackagesPath: string = path.resolve('dist', 'neo-one', 'packages');
const allExceptions: ReadonlyArray<string> = ['ec-key'];

const getInstallPackageName = (name: string): string => name.slice(8);
const readModules = (inputPath: string): ReadonlyArray<string> => fs.readdirSync(inputPath);
const pruneExceptions = (modules: ReadonlyArray<string>, exceptions: ReadonlyArray<string>): ReadonlyArray<string> =>
  modules.filter((mod) => !exceptions.includes(mod));
const deleteModules = (modules: ReadonlyArray<string>): void => {
  modules.forEach((dir) => fs.removeSync(path.resolve(playgroundPackagesPath, dir)));
};
const getModules = (modules: ReadonlyArray<string>): void => {
  modules.forEach((mod) =>
    fs.copySync(path.resolve(distPackagesPath, mod), path.resolve(playgroundPackagesPath, getInstallPackageName(mod))),
  );
};

const modulesRead = readModules(playgroundPackagesPath);
const prunedModules = pruneExceptions(modulesRead, allExceptions);
const modulesToGet = prunedModules.map((mod) => `neo-one-${mod}`);

deleteModules(prunedModules);
getModules(modulesToGet);
