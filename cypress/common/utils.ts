export interface PrepareCourseTestOptions {
  readonly slugs: ReadonlyArray<string>;
}

export const prepareCourseTest = ({ slugs }: PrepareCourseTestOptions) => {
  indexedDB.deleteDatabase('level-js-neo-one-node');
  indexedDB.deleteDatabase('neo-one-course');
  indexedDB.deleteDatabase('workbox-precache-http___localhost_3000_');
  slugs.forEach((slug) => {
    indexedDB.deleteDatabase(`_pouch_${slug}-fs`);
    indexedDB.deleteDatabase(`_pouch_${slug}-meta`);
    indexedDB.deleteDatabase(`_pouch_${slug}-transpile`);
  });
};
