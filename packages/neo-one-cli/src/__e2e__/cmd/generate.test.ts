// tslint:disable no-any
import { generateTests } from '../../__data__';

jest.setTimeout(300 * 1000);

describe('generate (ts, react)', () => {
  it('is a one stop command for local development of the ico project using typescript and the react framework.', async () => {
    await generateTests('ico');
  });
});

describe('generate (js, react)', () => {
  it('is a one stop command for local development of the ico project using javascript and the react framework.', async () => {
    await generateTests('ico-Js');
  });
});

describe('generate (ts, angular)', () => {
  it('is a one stop command for local development of the ico project using typescript and the angular framework.', async () => {
    await generateTests('ico-angular');
  });
});

describe('generate (js, angular)', () => {
  it('is a one stop command for local development of the ico project using javascript and the angular framework.', async () => {
    await generateTests('ico-angularJs');
  });
});

describe('generate (ts, vue)', () => {
  it('is a one stop command for local development of the ico project using typescript and the vue framework.', async () => {
    await generateTests('ico-vue');
  });
});

describe('generate (js, vue)', () => {
  it('is a one stop command for local development of the ico project using javascript and the vue framework.', async () => {
    await generateTests('ico-vueJs');
  });
});
