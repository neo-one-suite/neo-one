// tslint:disable only-arrow-functions no-object-mutation no-submodule-imports no-any no-invalid-template-strings
import { Package } from 'dgeni';
// @ts-ignore
import nunjucks from 'dgeni-packages/nunjucks';
import typescript from 'dgeni-packages/typescript';
import * as path from 'path';
import { textProcessor } from './processors';

const docFiles: ReadonlyArray<string> = [
  'neo-one-client-core/src/types.ts',
  'neo-one-client-core/src/Client.ts',
  'neo-one-client-core/src/DeveloperClient.ts',
  'neo-one-client-core/src/Hash256.ts',
  'neo-one-client-core/src/user/LocalUserAccountProvider.ts',
  'neo-one-client-core/src/user/LocalKeyStore.ts',
  'neo-one-client-core/src/user/LocalMemoryStore.ts',
  'neo-one-client-core/src/user/LocalStringStore.ts',
  'neo-one-client-core/src/provider/JSONRPCProvider.ts',
  'neo-one-client-core/src/provider/NEOONEDataProvider.ts',
  'neo-one-client-core/src/provider/NEOONEOneDataProvider.ts',
  'neo-one-client-core/src/provider/NEOONEProvider.ts',
  'neo-one-client-common/src/types.ts',
  'neo-one-client-common/src/helpers.ts',
  'neo-one-smart-contract/src/index.d.ts',
];

// Configuration of the typescript processor
(typescript as any)
  // Configure additional jsdoc style tags to be recognized by the processor
  .config(function(parseTagsProcessor: any) {
    const tagDefs = parseTagsProcessor.tagDefinitions;
    // Register '@example' tags with the processor. Multiple instances allowed.
    tagDefs.push({ name: 'example', multi: true });
    // Register '@param' tags with the processor.  Multiple instances allowed.
    tagDefs.push({ name: 'param', multi: true });
    // Register '@internal' tags with the processor.
    tagDefs.push({ name: 'internal' });
  })
  // Configure output paths for additional doc types
  .config(function(computeIdsProcessor: any, computePathsProcessor: any) {
    // Configure ID for "getters". Must be manually configured to avoid potential conflict with a property.
    computeIdsProcessor.idTemplates.push({
      docTypes: ['get-accessor-info'],
      // Template for constructing "getter" id. If we had same-named properties, we would need to use a different ID.
      idTemplate: '${containerDoc.id}.${name}',
      getAliases(doc: any) {
        return doc.containerDoc.aliases.map((alias: string) => `${alias}.${doc.name}`);
      },
    });

    // Configure output path for "getters". Must be manually configured to avoid potential conflict.
    computePathsProcessor.pathTemplates.push({
      docTypes: ['get-accessor-info'],
      // Template for constructing "getter" path. If we had same-named properties, we would need to use a different path.
      pathTemplate: '${containerDoc.path}#${name}',
      getOutputPath() {
        // These docs are not written to their own file, instead they are part of their class doc
      },
    });

    // Configure output path for overloaded functions. Each overload needs a unique output file to avoid conflict.
    computePathsProcessor.pathTemplates.push({
      docTypes: ['function-overload'],
      outputPathTemplate: 'partials/modules/${path}/index.html',
      // Template to generate unique path for each overload of a function.
      pathTemplate: '${moduleDoc.path}/${name}${parameterDocs.length}',
    });
  });

// Create a dgeni Package which defines how the code and comments are parsed into docs.
export const dgeniSetup = new Package('neo-one-docs', [
  // The typescript processor from dgeni-packages is used to parse typescript files.
  typescript,
  // The nunjucks processor from dgeni-packages is used to output docs to a template.
  nunjucks,
])
  // Register our custom processor for our specific use case.
  .processor(textProcessor)
  // Configure subprocessors from typescript and nunjucks
  .config(function(readFilesProcessor: any, readTypeScriptModules: any, templateFinder: any, writeFilesProcessor: any) {
    // Register basePath used for resolving paths to typescript files to parse.
    readTypeScriptModules.basePath = path.resolve(__dirname, '../../..');
    // Register basePath used for resolving paths to javascript files to parse. Unused in our case, but needs to exist.
    readFilesProcessor.basePath = '';

    // Register typescript files to parse. Paths relative to basePath.
    readTypeScriptModules.sourceFiles = docFiles;
    // Register javascript files to parse. None needed.
    readFilesProcessor.sourceFiles = [];

    // Directory where output template can be found.
    templateFinder.templateFolders.unshift(path.resolve(__dirname, 'templates'));
    // File name of the output template in the registered directory.
    templateFinder.templatePatterns.unshift('template.txt');

    // Directory to output generated files.
    writeFilesProcessor.outputFolder = path.resolve(__dirname, '../../../neo-one-website/src/utils/build');
  });
