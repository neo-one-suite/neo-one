import fs from 'fs-extra';
import nodePath from 'path';

const getPackage = (dependency: string) => ({
  name: 'test-project',
  version: '0.0.0',
  dependencies: {
    [dependency]: '0.0.0',
  },
});

const getTSConfig = () => ({
  compilerOptions: {
    module: 'commonjs',
    noImplicitAny: true,
    removeComments: true,
    preserveConstEnums: true,
    sourceMap: true,
  },
  exclude: [],
});

const setupAndInitDirectory = async ({
  dependency = 'none',
  js = false,
}: {
  readonly dependency?: string;
  readonly js?: boolean;
} = {}) => {
  const { exec: execAsync, env } = one.createCLIProject('init');

  const tmpDir = env.NEO_ONE_TMP_DIR === undefined ? process.cwd() : env.NEO_ONE_TMP_DIR;

  await fs.writeJSON(nodePath.join(tmpDir, 'package.json'), getPackage(dependency));
  if (!js) {
    await fs.writeJSON(nodePath.join(tmpDir, 'tsconfig.json'), getTSConfig());
  }

  await execAsync('init');

  await Promise.all([
    expect(fs.pathExists(nodePath.join(tmpDir, js ? '.neo-one.config.js' : '.neo-one.config.ts'))).resolves.toEqual(
      true,
    ),
    expect(fs.pathExists(nodePath.join(tmpDir, 'contracts'))).resolves.toEqual(true),
  ]);

  const [neoConfig, tsConfig] = await Promise.all([
    import(nodePath.join(tmpDir, js ? '.neo-one.config.js' : '.neo-one.config.ts')),
    fs.readJSON(nodePath.join(tmpDir, 'tsconfig.json')).catch(() => undefined),
  ]);

  if (!js) {
    expect(tsConfig.exclude).toEqual(['contracts/*.ts']);
  }

  return neoConfig;
};

describe('init command - no framework', () => {
  it('does not set framework if not implied', async () => {
    const {
      default: { codegen, contracts },
    } = await setupAndInitDirectory();

    expect(codegen).toEqual({
      path: nodePath.join('src', 'neo-one'),
      framework: 'none',
      browserify: false,
    });

    expect(contracts).toEqual({
      path: 'contracts',
    });
  });
});

describe('init command - js', () => {
  it('creates a .js config when no tsconfig', async () => {
    await setupAndInitDirectory({
      js: true,
    });
  });
});

describe('init command - react', () => {
  it('sets framework to react if package.json has react dependency', async () => {
    const {
      default: { codegen, contracts },
    } = await setupAndInitDirectory({
      dependency: 'react',
    });

    expect(codegen).toEqual({
      path: nodePath.join('src', 'neo-one'),
      framework: 'react',
      browserify: false,
    });

    expect(contracts).toEqual({
      path: 'contracts',
    });
  });
});

describe('init command - vue', () => {
  it('sets framework to vue if package.json has vue dependency', async () => {
    const {
      default: { codegen, contracts },
    } = await setupAndInitDirectory({
      dependency: 'vue',
    });

    expect(codegen).toEqual({
      path: nodePath.join('src', 'neo-one'),
      framework: 'vue',
      browserify: false,
    });

    expect(contracts).toEqual({
      path: 'contracts',
    });
  });
});

describe('init command - angular', () => {
  it('sets framework to angular if package.json has angular dependency', async () => {
    const {
      default: { codegen, contracts },
    } = await setupAndInitDirectory({
      dependency: '@angular/core',
    });

    expect(codegen).toEqual({
      path: nodePath.join('src', 'neo-one'),
      framework: 'angular',
      browserify: false,
    });

    expect(contracts).toEqual({
      path: 'contracts',
    });
  });
});
