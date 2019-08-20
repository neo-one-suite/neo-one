// tslint:disable no-console
import execa from 'execa';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';

const log = (value: string | Error) => {
  if (value instanceof Error) {
    console.error(value);
  } else {
    console.log(value);
  }
};

const WHITELIST = new Set(['tslib']);

const dir = path.resolve(__dirname, '..', 'packages');

const checkDependency = async (
  pkg: string,
  dependency: string,
  dependencies: { readonly [name: string]: string | undefined },
) => {
  if (WHITELIST.has(dependency)) {
    return;
  }

  if (dependency.startsWith('@types')) {
    if (dependencies[dependency.slice('@types/'.length)] === undefined) {
      log(`${pkg}: ${dependency} unused`);
    }

    return;
  }

  try {
    await execa('ack', [`["']${dependency}.*['"]`, path.resolve(dir, pkg, 'src')]);
  } catch {
    log(`${pkg}: ${dependency} unused`);
  }
};

interface Dependencies {
  readonly [name: string]: Set<string>;
}

const mergeDependencies = (a: Dependencies, b: Dependencies) => {
  const mutableOut: { [name: string]: Set<string> } = {};

  const addVersion = (name: string, version: string) => {
    if ((mutableOut[name] as Set<string> | undefined) === undefined) {
      mutableOut[name] = new Set();
    }

    mutableOut[name].add(version);
  };

  const addVersions = (name: string, versions: Set<string>) => {
    versions.forEach((version) => addVersion(name, version));
  };

  Object.entries(a).forEach(([name, version]) => addVersions(name, version));
  Object.entries(b).forEach(([name, version]) => addVersions(name, version));

  return mutableOut;
};

const getDependencies = (obj: { readonly [name: string]: string } | undefined): Dependencies => {
  if (obj === undefined) {
    return {};
  }

  return _.fromPairs(
    Object.entries(obj).map(([name, version]) => [
      name,
      new Set([version.startsWith('^') ? version.slice(1) : version]),
    ]),
  );
};

const checkPackage = async (pkg: string) => {
  const pkgJSONContents = await fs.readFile(path.resolve(dir, pkg, 'package.json'), 'utf8');

  const pkgJSON = JSON.parse(pkgJSONContents);
  const deps = pkgJSON.dependencies === undefined ? [] : pkgJSON.dependencies;
  const devDeps = pkgJSON.devDependencies === undefined ? [] : pkgJSON.devDependencies;
  const dependencies = { ...deps, ...devDeps };
  await Promise.all(
    Object.keys(dependencies).map(async (dependency) => checkDependency(pkg, dependency, dependencies)),
  );

  Object.entries(dependencies).forEach(([dep, version]) => {
    if (!(version as string).startsWith('^')) {
      console.log(`${pkg}: ${dep} missing caret`);
    }
  });

  if (Object.keys(deps).some((dep) => dep.startsWith('@types'))) {
    console.log(`${pkg} contains @types in dependencies`);
  }

  return mergeDependencies(getDependencies(pkgJSON.dependencies), getDependencies(pkgJSON.devDependencies));
};

const run = async () => {
  log('Checking dependencies...');
  const packages = await fs.readdir(dir);

  const depsList = await Promise.all(packages.filter((pkg) => pkg.startsWith('neo-one')).map(checkPackage));
  const allDeps = depsList.reduce(mergeDependencies, {});
  Object.entries(allDeps)
    .filter((value) => value[1].size > 1)
    .forEach(([name]) => {
      log(`${name} inconsistent versions`);
    });
};

run()
  .then(() => {
    log('Done');
    process.exit(0);
  })
  .catch((error) => {
    log(error);
    process.exit(1);
  });
