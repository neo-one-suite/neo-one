const lark_2 = 'lark';
const fizz = 'bang';
const foo_2 = 'foo2';

const bar = {
  fizz,
};

const lark = {
  lark: lark_2,
};

// tslint:disable-next-line:export-name
export { bar, foo_2 as foo2 };
export { lark as bark };

export const foo = 'foo';

export const bim = 'bap';
