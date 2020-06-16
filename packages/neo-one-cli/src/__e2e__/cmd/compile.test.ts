import fs from 'fs-extra';
import path from 'path';

const testCompileProject = async (project: string) => {
  const execAsync = one.createExec(project);
  await execAsync('compile');
  const {
    contracts: { outDir },
  } = await one.getProjectConfig(project);

  expect(outDir).toBeDefined();

  const abiFiles = await fs.readdir(outDir);
  const abiJsons = await Promise.all(abiFiles.map(async (file) => fs.readJSON(path.join(outDir, file))));

  abiJsons.forEach((abi) => {
    expect(abi).toMatchSnapshot();
  });
};

describe('compile - exchange', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('exchange');
  });
});
describe('compile - ico', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico');
  });
});
describe('compile - ico-angular', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico-angular');
  });
});
describe('compile - ico-angularJs', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico-angularJs');
  });
});
describe('compile - ico-Js', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico-Js');
  });
});
describe('compile - ico-neotracker', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico-neotracker');
  });
});
describe('compile - ico-vue', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico-vue');
  });
});
describe('compile - ico-vueJs', () => {
  it('compiles the contracts and outputs the ABI file', async () => {
    await testCompileProject('ico-vueJs');
  });
});
