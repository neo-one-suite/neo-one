import { args } from '@neo-one/client-core';
import fs from 'fs-extra';
import JSZip from 'jszip';
import path from 'path';

interface CLICompileOptions {
  readonly json: boolean;
  readonly nef: boolean;
  readonly debug: boolean;
  readonly opcodes: boolean;
}

// this is just a helper to replicate the coercing we do for the CLI command
const createOptions = (options: Partial<CLICompileOptions> = {}): CLICompileOptions => ({
  nef: options.nef ? options.nef : false,
  json: options.json ? options.json : !options.nef,
  debug: options.debug ? options.debug : false,
  opcodes: options.opcodes ? options.opcodes : false,
});

// tslint:disable-next-line: no-any
const testDebugFile = (contents: any) => {
  expect(contents.entrypoint).toBeDefined();
  expect(Array.isArray(contents.documents)).toEqual(true);
  expect(Array.isArray(contents.methods)).toEqual(true);
  expect(Array.isArray(contents.events)).toEqual(true);
  // tslint:disable-next-line: no-any
  contents.methods.forEach((method: any) => {
    expect(method.name).toBeDefined();
    expect(method.id).toBeDefined();
    expect(method.range).toBeDefined();
    expect(Array.isArray(method.params)).toEqual(true);
    expect(method.return).toBeDefined();
    expect(Array.isArray(method.variables)).toEqual(true);
    expect(Array.isArray(method['sequence-points'])).toEqual(true);
  });

  // tslint:disable-next-line: no-any
  contents.events.forEach((event: any) => {
    expect(event.id).toBeDefined();
    expect(event.name).toBeDefined();
    expect(Array.isArray(event.parameters)).toBeDefined();
  });
};

const testCompileProject = async (project: string, options: CLICompileOptions) => {
  const command = Object.entries(options).reduce(
    (acc, [flag, value]) => (value === true ? acc.concat(` --${flag} ${value}`) : acc),
    'compile',
  );
  await one.createExec(project)(command);

  const {
    contracts: { outDir },
  } = await one.getProjectConfig(project);

  expect(outDir).toBeDefined();

  const getTmpPath = (file: string) => path.resolve(outDir, file);

  const outFiles = await fs.readdir(outDir);
  const contractFiles = outFiles.filter((filename) => filename.endsWith('.contract.json'));
  const avmABIFiles = outFiles.filter(
    (filename) => filename.endsWith('.abi.json') && !filename.endsWith('.neoone.abi.json'),
  );
  const neooneABIFiles = outFiles.filter((filename) => filename.endsWith('.neoone.abi.json'));
  const debugFiles = outFiles.filter((filename) => filename.endsWith('.debug.json'));
  const avmFiles = outFiles.filter((filename) => filename.endsWith('.nef'));
  const avmDebugFiles = outFiles.filter((filename) => filename.endsWith('.nefdbgnfo'));
  const opcodeFiles = outFiles.filter((filename) => filename.endsWith('.nef.txt'));

  if (!options.json) {
    expect(contractFiles.length).toEqual(0);
    expect(neooneABIFiles.length).toEqual(0);
  }

  if (!options.nef) {
    expect(avmFiles.length).toEqual(0);
    expect(avmABIFiles.length).toEqual(0);
  }

  if (!options.debug) {
    expect(debugFiles.length).toEqual(0);
    expect(avmDebugFiles.length).toEqual(0);
  }

  if (!options.opcodes) {
    expect(opcodeFiles.length).toEqual(0);
  }

  if (options.json) {
    expect(contractFiles.length).toEqual(3);
    expect(neooneABIFiles.length).toEqual(3);
    await Promise.all(
      contractFiles.map(async (filename) => {
        const contents = await fs.readJSON(getTmpPath(filename));
        expect(contents.script).toBeDefined();
        expect(contents.parameters).toBeDefined();
        expect(contents.returnType).toBeDefined();
        expect(contents.name).toBeDefined();

        // we won't always check the nef buffer (it won't always check but will be enough)
        if (options.nef) {
          const avmFile = filename.replace('.contract.json', '.nef');
          const avmScript = await fs.readFile(getTmpPath(avmFile));
          expect(Buffer.from(contents.script, 'hex')).toEqual(avmScript);
        }
      }),
    );

    await Promise.all(
      neooneABIFiles.map(async (filename) => {
        const contents = await fs.readJSON(getTmpPath(filename));
        expect(() => args.assertContractManifestClient(filename, contents)).not.toThrow();
      }),
    );
  }

  if (options.opcodes) {
    expect(opcodeFiles.length).toEqual(3);
  }

  if (options.debug) {
    if (options.json) {
      expect(debugFiles.length).toEqual(3);
      await Promise.all(
        debugFiles.map(async (filename) => {
          const contents = await fs.readJSON(getTmpPath(filename));
          testDebugFile(contents);
        }),
      );
    }

    if (options.nef) {
      expect(avmDebugFiles.length).toEqual(3);
      expect(avmFiles.length).toEqual(3);
      await Promise.all(
        avmDebugFiles.map(async (filename) => {
          const rawFile = await fs.readFile(getTmpPath(filename));
          const zipped = await JSZip.loadAsync(rawFile);
          const zipContents = await zipped.file(filename.replace('.nefdbgnfo', '.debug.json'))?.async('text');
          if (zipContents === undefined) {
            throw new Error('contents should be defined here');
          }

          testDebugFile(JSON.parse(zipContents));
        }),
      );
    }
  }
};

describe('Compile ICO', () => {
  test('compile -- no flags', async () => {
    await testCompileProject('ico', createOptions());
  });

  test('compile -- avm flag', async () => {
    await testCompileProject('ico', createOptions({ nef: true }));
  });

  test('compile -- json & nef flag', async () => {
    await testCompileProject('ico', createOptions({ nef: true, json: true }));
  });

  test('compile -- debug flag', async () => {
    await testCompileProject('ico', createOptions({ debug: true }));
  });

  test('compile -- nef & debug flag', async () => {
    await testCompileProject('ico', createOptions({ nef: true, debug: true }));
  });

  test('compile -- nef && debug && opcodes flag', async () => {
    await testCompileProject('ico', createOptions({ nef: true, debug: true, opcodes: true }));
  });

  test('compile -- json & nef & debug', async () => {
    await testCompileProject('ico', createOptions({ json: true, nef: true, debug: true }));
  });
});
