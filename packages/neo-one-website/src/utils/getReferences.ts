import { Dgeni } from 'dgeni';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { ReferenceItem } from '../components';
import { dgeniSetup } from './dgeniSetup';
import { ModuleLinks, ModuleLinksPaths, tokenizeDocText } from './tokenizeDocText';

interface Parameter {
  readonly name: string;
  readonly type: readonly string[];
  readonly description: readonly string[];
  readonly examples?: ReadonlyArray<readonly string[]>;
}

interface Property extends Parameter {}

interface MethodBase {
  readonly name: string;
  readonly text: readonly string[];
  readonly parameters: readonly Parameter[];
}

interface Method extends MethodBase {
  readonly description: readonly string[];
  readonly returns?: readonly string[];
  readonly internal?: boolean;
  readonly examples?: ReadonlyArray<readonly string[]>;
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

const extractParametersProperties = (
  values: ReadonlyArray<Parameter | Property>,
  links: ModuleLinks,
  moduleName: string,
) =>
  values
    // Remove last element which is always empty to ensure the template follows the JSON comma pattern.
    .slice(0, -1)
    .filter((value) => !_.isEmpty(value))
    .filter((value) => !isMethod(value))
    .map((value) => ({
      name: value.name,
      type: tokenizeDocText(value.type, links, moduleName),
      description: tokenizeDocText(value.description, links, moduleName),
    }));

const isMethod = (value: Property) => value.type[0].charAt(0) === '(';

const extractConstructor = (constructorDoc: MethodBase, links: ModuleLinks, moduleName: string) => ({
  title: constructorDoc.name,
  definition: tokenizeDocText(constructorDoc.text, links, moduleName),
  functionData: {
    parameters: extractParametersProperties(constructorDoc.parameters, links, moduleName),
  },
});

const extractMethodBase = ({
  title,
  definition,
  description,
  links,
  moduleName,
  functionData,
  examples,
}: {
  readonly title: string;
  readonly definition: readonly string[];
  readonly description: readonly string[];
  readonly links: ModuleLinks;
  readonly moduleName: string;
  readonly functionData?: {
    readonly parameters: readonly Parameter[];
    readonly returns?: readonly string[];
  };
  readonly examples?: ReadonlyArray<readonly string[]>;
}) => ({
  title,
  definition: tokenizeDocText(definition, links, moduleName),
  description: tokenizeDocText(description, links, moduleName),
  functionData:
    functionData === undefined
      ? {}
      : {
          parameters: extractParametersProperties(functionData.parameters, links, moduleName),
          returns:
            functionData.returns === undefined ? undefined : tokenizeDocText(functionData.returns, links, moduleName),
        },
  extra:
    examples === undefined
      ? undefined
      : // Remove last element which is always empty to ensure the template follows the JSON comma pattern.
        examples.slice(0, -1).map((example) => ({
          title: 'Example',
          code: true,
          data: tokenizeDocText(example, links, moduleName),
        })),
});

const extractMethods = (
  methods: readonly Method[],
  properties: readonly Property[],
  links: ModuleLinks,
  moduleName: string,
) => {
  const parsedMethods = methods
    // Remove last element which is always empty to ensure the template follows the JSON comma pattern.
    .slice(0, -1)
    .filter((method) => !_.isEmpty(method))
    .filter((method) => !method.internal)
    .filter((method) => method.text[0].substr(0, 9) !== 'protected')
    .filter((method) => method.name !== '__index')
    .map((method) =>
      extractMethodBase({
        title: method.name,
        definition: method.text,
        description: method.description,
        functionData: {
          parameters: method.parameters,
          returns: method.returns,
        },
        examples: method.examples,
        links,
        moduleName,
      }),
    );

  const propertyMethods = properties
    // Remove last element which is always empty to ensure the template follows the JSON comma pattern.
    .slice(0, -1)
    .filter((property) => !_.isEmpty(property))
    .filter(isMethod)
    .map((method) =>
      extractMethodBase({
        title: method.name,
        definition: method.type,
        description: method.description,
        examples: method.examples,
        links,
        moduleName,
      }),
    );

  return propertyMethods.concat(parsedMethods);
};

const convertDocType = (type: string) =>
  type === 'type-alias' ? 'Type Alias' : `${type.charAt(0).toUpperCase()}${type.substr(1)}`;

const getStaticPath = (name: string, links: ModuleLinks, moduleName: string) => {
  const staticPath = links[moduleName].paths.find((pathString) => pathString.includes(`${name}Constructor`));

  return staticPath === undefined
    ? links[moduleName].paths.find((pathString) =>
        pathString.includes(`${name.charAt(0).toUpperCase()}${name.substr(1)}Constructor`),
      )
    : staticPath;
};

const getReference = async (refPath: string, links: ModuleLinks, moduleName: string) => {
  let contents = await fs.readJSON(refPath);

  const staticPath = getStaticPath(contents.name, links, moduleName);
  let staticContents;
  if (staticPath !== undefined) {
    staticContents = await fs.readJSON(staticPath);
    if (contents.docType === 'const') {
      contents = {
        ...staticContents,
        name: contents.name,
        text: [staticContents.text[0].replace(staticContents.name, contents.name)].concat(staticContents.text.slice(1)),
        docType: contents.docType,
      };
    }
  }

  return {
    name: contents.name,
    type: convertDocType(contents.docType),
    slug: `/reference/${moduleName}/${contents.name.toLowerCase()}`,
    definition: tokenizeDocText(contents.text, links, moduleName),
    description: tokenizeDocText(contents.description, links, moduleName),
    functionData:
      contents.docType === 'function'
        ? {
            parameters:
              contents.parameters === undefined
                ? undefined
                : extractParametersProperties(contents.parameters, links, moduleName),
            returns: contents.returns === undefined ? undefined : tokenizeDocText(contents.returns, links, moduleName),
          }
        : undefined,
    classData:
      contents.docType === 'class'
        ? {
            constructorDefinition:
              contents.constructorDoc === undefined
                ? undefined
                : extractConstructor(contents.constructorDoc, links, moduleName),
            properties:
              contents.properties === undefined
                ? undefined
                : extractParametersProperties(contents.properties, links, moduleName),
            methods:
              contents.methods === undefined
                ? undefined
                : extractMethods(contents.methods, contents.properties, links, moduleName),
          }
        : undefined,
    interfaceData:
      contents.docType === 'interface'
        ? {
            properties:
              contents.properties === undefined
                ? undefined
                : extractParametersProperties(contents.properties, links, moduleName),
            methods:
              contents.methods === undefined
                ? undefined
                : extractMethods(contents.methods, contents.properties, links, moduleName),
            staticMethods:
              staticContents === undefined
                ? undefined
                : extractMethods(staticContents.methods, staticContents.properties, links, moduleName),
          }
        : undefined,
    enumData:
      contents.docType === 'enum'
        ? {
            properties:
              contents.properties === undefined
                ? undefined
                : extractParametersProperties(contents.properties, links, moduleName),
          }
        : undefined,
    constData:
      contents.docType === 'const'
        ? {
            properties:
              contents.properties === undefined
                ? undefined
                : extractParametersProperties(contents.properties, links, moduleName),
            staticMethods:
              contents.methods === undefined
                ? undefined
                : extractMethods(contents.methods, contents.properties, links, moduleName),
          }
        : undefined,
    extra:
      contents.examples === undefined
        ? undefined
        : // Remove last element which is always empty to ensure the template follows the JSON comma pattern.
          contents.examples.slice(0, -1).map((example: readonly string[]) => ({
            title: 'Example',
            code: true,
            data: tokenizeDocText(example, links, moduleName),
          })),
  };
};

const getSidebar = (links: ModuleLinks) => [
  {
    title: 'Packages',
    subsections: Object.keys(links).map((subsection) => ({
      slug: `/reference/${subsection}`,
      title: subsection,
    })),
  },
];

export const getReferences = async () => {
  await dgenerate();
  const links = await getLinks();

  const references = await Promise.all(
    Object.entries(links).map(async ([moduleName, moduleLinksPaths]) => {
      const refItems = await Promise.all(
        moduleLinksPaths.paths.map(async (refPath) =>
          refPath.includes('Constructor') ? undefined : getReference(refPath, links, moduleName),
        ),
      );
      const slug = `/reference/${moduleName}`;

      return {
        title: moduleName,
        slug,
        type: 'All',
        content: {
          type: 'referenceItems',
          value: _.sortBy(refItems.filter((item) => item !== undefined), [(item) => (item as ReferenceItem).name]).map(
            (item) => ({
              title: (item as ReferenceItem).name,
              slug: (item as ReferenceItem).slug,
              content: { type: 'referenceItem', value: item },
              current: slug,
              sidebar: getSidebar(links),
            }),
          ),
        },
        current: slug,
        sidebar: getSidebar(links),
      };
    }),
  );

  await fs.remove(path.resolve(__dirname, 'build'));

  return references;
};
