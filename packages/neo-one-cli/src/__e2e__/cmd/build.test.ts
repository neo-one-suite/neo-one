// tslint:disable no-any
import { buildTests } from '../../__data__';

jest.setTimeout(300 * 1000);

describe.only('build (ts, react)', () => {
  it('is a one stop command for local development of the ico project using typescript and the react framework.', async () => {
    await buildTests('ico');
  });
});

describe.only('build (js, react)', () => {
  it('is a one stop command for local development of the ico project using javascript and the react framework.', async () => {
    await buildTests('ico-Js');
  });
});

describe('build (ts, angular)', () => {
  it('is a one stop command for local development of the ico project using typescript and the angular framework.', async () => {
    await buildTests('ico-angular');
  });
});

describe('build (js, angular)', () => {
  it('is a one stop command for local development of the ico project using javascript and the angular framework.', async () => {
    await buildTests('ico-angularJs');
  });
});

describe('build (ts, vue)', () => {
  it('is a one stop command for local development of the ico project using typescript and the vue framework.', async () => {
    await buildTests('ico-vue');
  });
});

describe('build (js, vue)', () => {
  it('is a one stop command for local development of the ico project using javascript and the vue framework.', async () => {
    await buildTests('ico-vueJs');
  });
});
