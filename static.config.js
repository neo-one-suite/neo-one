import path from 'path';
import _ from 'lodash';

require('ts-node/register/transpile-only');
const { getCourses } = require('./packages/neo-one-website/src/loaders/coursesLoader');
const { getDocs } = require('./packages/neo-one-website/src/utils/getDocs');
const { getTutorial } = require('./packages/neo-one-website/src/utils/getTutorial');

const ROOT_DIR = path.resolve(__dirname);

export default {
  paths: {
    root: path.resolve(ROOT_DIR, 'packages', 'neo-one-website'),
    node_modules: path.resolve(ROOT_DIR, 'node_modules'),
  },
  entry: path.join('src', 'index'),
  getSiteData: () => ({
    title: 'React Static',
  }),
  getRoutes: async () => {
    const [courses, docs, tutorial] = await Promise.all([getCourses(), getDocs(), getTutorial()]);

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
        children: docs.map((doc) => ({
          path: `${doc.slug}`,
          component: 'src/pages/docs',
          getData: async () => ({
            sidebar: Object.entries(
              _.groupBy(
                docs.map((document) => ({
                  title: document.title,
                  slug: document.slug,
                  section: document.section,
                })),
                (obj) => obj.section,
              ),
            ).map(([section, subsections]) => ({
              section,
              subsections: subsections.map((subsection) => ({
                title: subsection.title,
                slug: subsection.slug,
              })),
            })),
            doc: doc.doc,
            next: doc.next,
            previous: doc.previous,
          }),
        })),
      },
      {
        path: '/tutorial',
        component: 'src/pages/tutorial',
        getData: async () => tutorial,
      },
    ];
  },
  extractCssChunks: true,
  plugins: [path.resolve(ROOT_DIR, 'scripts', 'website', 'webpack', 'plugin')],
  siteRoot: 'https://neo-one.io',
};
