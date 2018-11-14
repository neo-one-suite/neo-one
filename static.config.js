import path from 'path';
import _ from 'lodash';

require('ts-node/register/transpile-only');
const { getCourses } = require('./packages/neo-one-website/src/loaders/coursesLoader');
const { getDocs } = require('./packages/neo-one-website/src/utils/getDocs');
const { getTutorial } = require('./packages/neo-one-website/src/utils/getTutorial');
const { getBlogs } = require('./packages/neo-one-website/src/utils/getBlogs');

const ROOT_DIR = path.resolve(__dirname);
const ROOT = path.resolve(ROOT_DIR, 'packages', 'neo-one-website');

const links = ['Hamlet', 'Ham', 'Forever', 'Buffalo', 'BLARG_DARG', 'One', 'Boofus'];

const tokenizeExample = (example) =>
  example
    .split(' ')
    .map((word) =>
      links.includes(word)
        ? { slug: `/reference/${word.toLowerCase()}`, value: word }
        : { slug: undefined, value: word },
    );

const functionRefItem = {
  name: 'ThingOne',
  slug: '/reference/thingone',
  type: 'Function',
  description: tokenizeExample('Returns the first One from the thing.'),
  definition: tokenizeExample('thingOne(thing: string, otherThing: Hamlet | number ): One'),
  parameters: [
    {
      name: 'thing',
      type: tokenizeExample('string'),
      description: tokenizeExample('The thing from which to extract a Boofus .  Does the following:'),
    },
    {
      name: 'otherThing',
      type: tokenizeExample('Hamlet | number'),
      description: tokenizeExample(
        'The Hamlet fro which your thing originated.  Needed for Such and such and such. For example, you might pick a Hamlet from Oaxaca.  Or maybe a Hamlet from the lexical menagerie.',
      ),
    },
  ],
};

const constRefItem = {
  name: 'BlargDarg',
  slug: '/reference/blargdarg',
  type: 'Const',
  description: tokenizeExample('Specifies Blargdarg.'),
  definition: tokenizeExample(`const BLARG_DARG = 'blarg-darg'`),
};

const classDefinition = `interface Hamlet extends Ham {
  readonly meatLoaf: string ;
  readonly boosuf: Buffalo ;
  readonly methodBoop: (yardstick: string) => Promise< Forever > ;
}`;

const classRefItem = {
  name: 'Hamlet',
  slug: '/reference/hamlet',
  type: 'Class',
  description: tokenizeExample(
    'Class for managing all your little hamlets. Does a lot of things and I want this sentece to be just a bit longer so that I can make sure long descriptions work well',
  ),
  definition: tokenizeExample(classDefinition),
};

const refChildren = [functionRefItem, constRefItem, classRefItem];

const refSidebar = [
  {
    title: 'Packages',
    subsections: [
      { slug: '@neo-one/client', title: '@neo-one/client' },
      { slug: '@neo-one/client-full', title: '@neo-one/client-full' },
      { slug: '@neo-one/smart-contract', title: '@neo-one/smart-contract' },
    ],
  },
];

export default {
  paths: {
    root: ROOT,
    nodeModules: path.resolve(ROOT_DIR, 'node_modules'),
    public: 'publicOut',
  },
  entry: path.join('src', 'index'),
  getSiteData: () => ({
    title: 'React Static',
  }),
  getRoutes: async () => {
    const [courses, docs, tutorial, { blogs, blogAll }] = await Promise.all([
      getCourses(),
      getDocs(),
      getTutorial(),
      getBlogs(),
    ]);

    return [
      {
        path: '/',
        component: 'src/pages/index',
      },
      {
        path: '/course',
        component: 'src/pages/course',
        children: _.flatMap(
          Object.entries(courses).map(([slug, course]) =>
            course.lessons.map((_lesson, lesson) => ({
              path: `${slug}/${lesson + 1}`,
              component: 'src/pages/course',
              children: _lesson.chapters.map((_chapter, chapter) => ({
                path: `${chapter + 1}`,
                component: 'src/pages/course',
              })),
            })),
          ),
        ),
      },
      {
        path: '/404',
        component: 'src/pages/404',
      },
      {
        path: '/docs',
        component: 'src/pages/docsRedirect',
        getData: async () => ({
          redirect: docs[0].current,
        }),
        children: docs.map((doc) => ({
          path: doc.current.slice('/docs/'.length),
          component: 'src/pages/docs',
          getData: async () => doc,
        })),
      },
      {
        path: '/tutorial',
        component: 'src/pages/tutorial',
        getData: async () => tutorial,
      },
      {
        path: '/blog',
        component: 'src/pages/blogRedirect',
        getData: async () => ({
          redirect: blogs[0].current,
        }),
        children: blogs
          .map((blog) => ({
            path: blog.current.slice('/blog/'.length),
            component: 'src/pages/blog',
            getData: async () => blog,
          }))
          .concat([
            {
              path: 'all',
              component: 'src/pages/blogAll',
              getData: async () => blogAll,
            },
          ]),
      },
      {
        path: '/reference',
        component: 'src/pages/reference',
        getData: async () => ({
          title: '@neo-one/client',
          type: 'All',
          content: {
            type: 'referenceItems',
            value: [
              functionRefItem,
              constRefItem,
              classRefItem,
              functionRefItem,
              classRefItem,
              functionRefItem,
              constRefItem,
              classRefItem,
              functionRefItem,
              constRefItem,
              classRefItem,
            ],
          },
          current: '@neo-one/client',
          sidebar: refSidebar,
        }),
        children: refChildren.map((ref) => ({
          path: ref.slug.slice('/reference/'.length),
          component: 'src/pages/reference',
          getData: async () => ({
            title: ref.name,
            content: { type: 'referenceItem', value: ref },
            current: `@neo-one/client`,
            sidebar: refSidebar,
          }),
        })),
      },
    ];
  },
  extractCssChunks: true,
  disablePreload: true,
  plugins: [path.resolve(ROOT_DIR, 'scripts', 'website', 'webpack', 'plugin')],
  siteRoot: 'https://neo-one.io',
};
