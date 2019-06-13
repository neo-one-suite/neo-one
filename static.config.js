import path from 'path';
import _ from 'lodash';

require('ts-node/register/transpile-only');
const { getCourses } = require('./packages/neo-one-website/src/loaders/coursesLoader');
const { getDocs } = require('./packages/neo-one-website/src/utils/getDocs');
const { getTutorial } = require('./packages/neo-one-website/src/utils/getTutorial');
const { getBlogs } = require('./packages/neo-one-website/src/utils/getBlogs');
const { getReferences } = require('./packages/neo-one-website/src/utils/getReferences');

const ROOT_DIR = path.resolve(__dirname);
const ROOT = path.resolve(ROOT_DIR, 'packages', 'neo-one-website');

const getPagePath = (file) => path.resolve(ROOT, 'src', 'pages', file);

export default {
  paths: {
    root: ROOT,
    nodeModules: path.resolve(ROOT_DIR, 'node_modules'),
    public: 'publicOut',
  },
  entry: path.resolve(ROOT, 'src', 'index'),
  getSiteData: () => ({
    title: 'React Static',
  }),
  getRoutes: async () => {
    const [courses, docs, tutorial, { blogs, blogAll }, references] = await Promise.all([
      getCourses(),
      getDocs(),
      getTutorial(),
      getBlogs(),
      getReferences(),
    ]);

    return [
      {
        path: '/',
        template: getPagePath('index'),
      },
      {
        path: '/course',
        template: getPagePath('course'),
        children: _.flatMap(
          Object.entries(courses).map(([slug, course]) =>
            course.lessons.map((_lesson, lesson) => ({
              path: `${slug}/${lesson + 1}`,
              template: getPagePath('course'),
              children: _lesson.chapters.map((_chapter, chapter) => ({
                path: `${chapter + 1}`,
                template: getPagePath('course'),
              })),
            })),
          ),
        ),
      },
      {
        path: '/404',
        template: getPagePath('404'),
      },
      {
        path: '/docs',
        template: getPagePath('docsRedirect'),
        getData: async () => ({
          redirect: docs[0].current,
        }),
        children: docs.map((doc) => ({
          path: doc.current.slice('/docs/'.length),
          template: getPagePath('docs'),
          getData: async () => doc,
        })),
      },
      {
        path: '/tutorial',
        template: getPagePath('tutorial'),
        getData: async () => tutorial,
      },
      {
        path: '/blog',
        template: getPagePath('blogRedirect'),
        getData: async () => ({
          redirect: blogs[0].current,
        }),
        children: blogs
          .map((blog) => ({
            path: blog.current.slice('/blog/'.length),
            template: getPagePath('blog'),
            getData: async () => blog,
          }))
          .concat([
            {
              path: 'all',
              template: getPagePath('blogAll'),
              getData: async () => blogAll,
            },
          ]),
      },
      {
        path: '/reference',
        template: getPagePath('referenceRedirect'),
        getData: async () => ({
          redirect: references[0].current,
        }),
        children: references.map((moduleRef) => ({
          path: moduleRef.slug.slice('/reference/'.length),
          template: getPagePath('reference'),
          getData: async () => moduleRef,
          children: moduleRef.content.value.map((ref) => ({
            path: ref.slug.slice(`/reference/${moduleRef.title}/`.length),
            template: getPagePath('reference'),
            getData: async () => ref,
          })),
        })),
      },
    ];
  },
  extractCssChunks: true,
  productionSourceMaps: true,
  disablePreload: true,
  plugins: [
    path.resolve(ROOT_DIR, 'scripts', 'website', 'webpack', 'plugin'),
    'react-static-plugin-reach-router',
    [
      'react-static-plugin-source-filesystem',
      {
        location: path.resolve(ROOT, 'src', 'pages'),
      },
    ],
  ],
  siteRoot: 'https://neo-one.io',
};
