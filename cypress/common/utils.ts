export interface PrepareCourseTestOptions {
  readonly slugs: ReadonlyArray<string>;
}

export const prepareCourseTest = ({ slugs }: PrepareCourseTestOptions) => {
  indexedDB.deleteDatabase('level-js-neo-one-node');
  indexedDB.deleteDatabase('neo-one-course');
  slugs.forEach((slug) => {
    indexedDB.deleteDatabase(slug);
  });
};
