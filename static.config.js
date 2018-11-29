import path from 'path';
import _ from 'lodash';

require('ts-node/register/transpile-only');
const { getCourses } = require('./packages/neo-one-website/src/loaders/coursesLoader');
const { getDocs } = require('./packages/neo-one-website/src/utils/getDocs');
const { getTutorial } = require('./packages/neo-one-website/src/utils/getTutorial');
const { getBlogs } = require('./packages/neo-one-website/src/utils/getBlogs');

const ROOT_DIR = path.resolve(__dirname);
const ROOT = path.resolve(ROOT_DIR, 'packages', 'neo-one-website');

const links = [
  'Hamlet',
  'Ham',
  'Forever',
  'Buffalo',
  'BLARG_DARG',
  'One',
  'Boofus',
  'Fish',
  '@const',
  'HermogianReturnType',
];

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
  functionData: {
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
    returns: tokenizeExample('One : The one thing that is returned.'),
  },
};

const constRefItem = {
  name: 'BlargDarg',
  slug: '/reference/blargdarg',
  type: 'Const',
  description: tokenizeExample('Specifies Blargdarg.'),
  definition: tokenizeExample(`const BLARG_DARG = 'blarg-darg'`),
};

const decoratorRefItem = {
  name: '@const',
  slug: '/reference/@const',
  type: 'Decorator',
  description: tokenizeExample(
    'Decorator used to declare smart contract methods as not modifying smart contract storage.',
  ),
  definition: tokenizeExample(
    `@const
public balanceOf(address: Address) {
  //returnsBalance
}`,
  ),
};

const enumRefItem = {
  name: 'HermogianReturnType',
  slug: '/reference/hermogianreturntype',
  type: 'Enum',
  description: tokenizeExample('Enumeration of all possible return types from a Hermogian function.'),
  definition: tokenizeExample(
    `enum HemogianReturnType {
      Boolean = 'bool',
      Integer = 'int',
      Void = 'void',
    }`,
  ),
  enumData: {
    members: [
      {
        name: 'Boolean',
        description: tokenizeExample('Indicates return type of boolean.'),
      },
      {
        name: 'Integer',
        description: tokenizeExample('return type of integer.'),
      },
      {
        name: 'Void',
        description: tokenizeExample('return type of void.'),
      },
    ],
  },
};

const typeAliasRefItem = {
  name: 'Fish',
  slug: '/reference/salmon',
  type: 'Type Alias',
  description: tokenizeExample('Union type for all possible types of fish'),
  definition: tokenizeExample(`type Fish = 'salmon' | 'carp' | 'tuna'`),
  extra: [
    {
      title: 'Usage Example',
      code: false,
      data: tokenizeExample('See below example of how to properly use a Fish .'),
    },
    {
      code: true,
      data: tokenizeExample(`function goFishing(fish: Fish ): boolean`),
    },
  ],
};

const interfaceRefItem = {
  name: 'Raramulus',
  slug: '/reference/raramulus',
  type: 'Interface',
  description: tokenizeExample('Interface which defines properties of a Raramulus'),
  definition: tokenizeExample(
    `interface Raramulus {
      readonly apple: Hamlet ;
      readonly cow: string;
      readonly help() => string;
    }`,
  ),
  interfaceData: {
    properties: [
      {
        name: 'apple',
        type: tokenizeExample('Hamlet'),
        description: tokenizeExample('apple stores the Hamlet data.'),
      },
      {
        name: 'cow',
        type: tokenizeExample('string'),
        description: tokenizeExample('stores the cow to be used by the Raramulus .'),
      },
    ],
    methods: [
      {
        title: 'help()',
        definition: tokenizeExample(`help() => void;`),
        description: tokenizeExample(`method which provides help to the user.`),
        functionData: {
          returns: tokenizeExample('void'),
        },
      },
    ],
  },
};

const classDefinition = `interface Hamlet extends Ham {
  readonly meatLoaf: string ;
  readonly boosuf: Buffalo ;
  readonly methodBoop: (yardstick: string) => Promise< Forever > ;
  readonly methodDoop: (hungryHippo: number) => string ;
}`;

const classRefItem = {
  name: 'Hamlet',
  slug: '/reference/hamlet',
  type: 'Class',
  description: tokenizeExample(
    'Class for managing all your little hamlets. Does a lot of things and I want this sentece to be just a bit longer so that I can make sure long descriptions work well',
  ),
  definition: tokenizeExample(classDefinition),
  classData: {
    constructorDefinition: {
      title: 'new Hamlet()',
      definition: tokenizeExample('constructor(meatLoaf: string, boosuf: Buffalo )'),
      functionData: {
        parameters: [
          {
            name: 'meatLoaf',
            type: tokenizeExample('string'),
            description: tokenizeExample('The primary food source in the Hamlet .'),
          },
          {
            name: 'boosuf',
            type: tokenizeExample('Buffalo'),
            description: tokenizeExample('The primary source of meat for meatLoafs in your Hamlet .'),
          },
        ],
      },
    },
    properties: [
      {
        name: 'meatLoaf',
        type: tokenizeExample('string'),
        description: tokenizeExample('The primary food source in the Hamlet .'),
      },
      {
        name: 'boosuf',
        type: tokenizeExample('Buffalo'),
        description: tokenizeExample('The primary source of meat for meatLoafs in your Hamlet .'),
      },
    ],
    methods: [
      {
        title: 'methodBoop()',
        definition: tokenizeExample(`methodBoop(yardstick: string) => Promise< Forever >;`),
        description: tokenizeExample('Method which boops your class.'),
        functionData: {
          parameters: [
            {
              name: 'yardstick',
              type: tokenizeExample('string'),
              description: tokenizeExample(
                'The stick by which to measure the yard.  Particularly useful for working with BlargDarg .',
              ),
            },
          ],
          returns: tokenizeExample('Promise < Forever >: Returns a Forever object asynchronously.'),
        },
      },
      {
        title: 'methodDoop()',
        definition: tokenizeExample(`methodDoop(hungryHippo: number) => string ;`),
        description: tokenizeExample('Method which doops your class.'),
        functionData: {
          parameters: [
            {
              name: 'hungryHippo',
              type: tokenizeExample('number'),
              description: tokenizeExample('The number of hungry hippos to doop.'),
            },
          ],
          returns: tokenizeExample('string : The string which is the result of the doop.'),
        },
      },
    ],
  },
};

const refChildren = [
  functionRefItem,
  constRefItem,
  classRefItem,
  decoratorRefItem,
  enumRefItem,
  interfaceRefItem,
  typeAliasRefItem,
];

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
            value: refChildren,
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
