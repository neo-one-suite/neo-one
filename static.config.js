import path from 'path';
import _ from 'lodash';

require('ts-node/register/transpile-only');
const { getCourses } = require('./packages/neo-one-website/src/loaders/coursesLoader');
const { getDocs } = require('./packages/neo-one-website/src/utils/getDocs');
const { getTutorial } = require('./packages/neo-one-website/src/utils/getTutorial');
const { getBlogs } = require('./packages/neo-one-website/src/utils/getBlogs');

const ROOT_DIR = path.resolve(__dirname);
const ROOT = path.resolve(ROOT_DIR, 'packages', 'neo-one-website');

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
    ];
  },
  extractCssChunks: true,
  disablePreload: true,
  plugins: [path.resolve(ROOT_DIR, 'scripts', 'website', 'webpack', 'plugin')],
  siteRoot: 'https://neo-one.netlify.com',
};
