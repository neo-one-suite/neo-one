import { Dgeni } from 'dgeni';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { dgeniSetup } from './dgeniSetup';
import { ModuleLinks, ModuleLinksPaths, tokenizeDocText } from './tokenizeDocText';

interface Parameter {
  readonly name: string;
  readonly type: ReadonlyArray<string>;
  readonly description: ReadonlyArray<string>;
}

interface Property extends Parameter {}

interface MethodBase {
  readonly name: string;
  readonly text: ReadonlyArray<string>;
  readonly parameters: ReadonlyArray<Parameter>;
}

interface Method extends MethodBase {
  readonly description: ReadonlyArray<string>;
  readonly returns?: ReadonlyArray<string>;
  readonly internal?: boolean;
}

const BASE_PATH = path.resolve(__dirname, 'build', 'partials', 'modules');

const dgenerate = async () => {
  const dgeni = new Dgeni([dgeniSetup]);

  await fs.emptyDir(path.resolve(__dirname, 'build'));
  await dgeni.generate();
};

const mapModule = (moduleName: string) => {
  switch (moduleName) {
    case 'neo-one-client-common':
      return '@neo-one/client';
    case 'neo-one-client-core':
      return '@neo-one/client';
    case 'neo-one-smart-contract':
      return '@neo-one/smart-contract';
    default:
      return '';
  }
};

const getLinksFromModule = async (currentPath: string, dirName: string): Promise<ModuleLinksPaths> => {
  const modulePath = path.resolve(currentPath, dirName);
  const dirsFiles = await fs.readdir(modulePath);
  const dirs = dirsFiles.filter((name) => name !== 'index.json');

  if (_.isEmpty(dirs)) {
    return {
      links: [dirName],
      paths: [path.resolve(modulePath, 'index.json')],
    };
  }

  const links = await Promise.all(dirs.map(async (dir) => getLinksFromModule(path.resolve(currentPath, dirName), dir)));

  return {
    links: _.flatten(links.map((link) => link.links)),
    paths: _.flatten(links.map((link) => link.paths)),
  };
};

const getLinks = async (): Promise<{ readonly [moduleName: string]: ModuleLinksPaths }> => {
  const moduleNames = await fs.readdir(BASE_PATH);

  return moduleNames.reduce(async (acc, moduleName) => {
    const moduleLinks = await getLinksFromModule(BASE_PATH, moduleName);
    const accRes = await acc;

    if (Object.keys(accRes).includes(mapModule(moduleName))) {
      const accModuleLinks = Object.entries(accRes).find(([name]) => name === mapModule(moduleName));

      return {
        ...accRes,
        [mapModule(moduleName)]: {
          links:
            accModuleLinks === undefined
              ? moduleLinks.links
              : (accModuleLinks[1] as ModuleLinksPaths).links.concat(moduleLinks.links),
          paths:
            accModuleLinks === undefined
              ? moduleLinks.paths
              : (accModuleLinks[1] as ModuleLinksPaths).paths.concat(moduleLinks.paths),
        },
      };
    }

    return {
      ...accRes,
      [mapModule(moduleName)]: moduleLinks,
    };
  }, Promise.resolve({}));
};

const extractParametersProperties = (values: ReadonlyArray<Parameter | Property>, links: ModuleLinks) =>
  values
    .filter((param) => !_.isEmpty(param))
    .map((param) => ({
      name: param.name,
      type: tokenizeDocText(param.type, links),
      description: tokenizeDocText(param.description, links),
    }));

const extractConstructor = (constructorDoc: MethodBase, links: ModuleLinks) => ({
  name: constructorDoc.name,
  text: tokenizeDocText(constructorDoc.text, links),
  parameters: extractParametersProperties(constructorDoc.parameters, links),
});

const extractMethods = (methods: ReadonlyArray<Method>, links: ModuleLinks) =>
  methods
    .filter((method) => !_.isEmpty(method))
    .filter((method) => !method.internal)
    .map((method) => ({
      name: method.name,
      text: tokenizeDocText(method.text, links),
      parameters: extractParametersProperties(method.parameters, links),
      description: tokenizeDocText(method.description, links),
      returns: method.returns === undefined ? undefined : tokenizeDocText(method.returns, links),
    }));

const getReference = async (refPath: string, links: ModuleLinks) => {
  const contents = await fs.readJSON(refPath);

  return {
    name: contents.name,
    docType: contents.docType,
    text: tokenizeDocText(contents.text, links),
    description: tokenizeDocText(contents.description, links),
    parameters: contents.parameters === undefined ? undefined : extractParametersProperties(contents.parameters, links),
    constructorDoc:
      contents.constructorDoc === undefined ? undefined : extractConstructor(contents.constructorDoc, links),
    properties: contents.properties === undefined ? undefined : extractParametersProperties(contents.properties, links),
    methods: contents.methods === undefined ? undefined : extractMethods(contents.methods, links),
    returns: contents.returns === undefined ? undefined : tokenizeDocText(contents.returns, links),
    examples:
      contents.examples === undefined
        ? undefined
        : contents.examples.map((example: ReadonlyArray<string>) => tokenizeDocText(example, links)),
  };
};

const getSidebar = (links: ModuleLinks) => ({
  title: 'Packages',
  subsections: Object.keys(links).map((subsection) => ({
    slug: subsection,
    title: subsection,
  })),
});

export const getReferences = async () => {
  await dgenerate();
  const links = await getLinks();

  return Object.entries(links).map(async ([moduleName, moduleLinksPaths]) => {
    const refItems = await Promise.all(moduleLinksPaths.paths.map(async (refPath) => getReference(refPath, links)));

    return {
      title: moduleName,
      type: 'All',
      content: {
        type: 'referenceItems',
        value: refItems,
      },
      current: '@neo-one/client',
      sidebar: getSidebar(links),
    };
  });
};
