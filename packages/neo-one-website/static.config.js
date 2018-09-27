import path from 'path';
import _ from 'lodash';

require('ts-node/register/transpile-only');
const { getCourses } = require('./src/loaders/coursesLoader');
const { getDocs } = require('./src/utils/getDocs');

// Paths Aliases defined through tsconfig.json
export default {
  entry: path.join(__dirname, 'src', 'index.tsx'),
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  getSiteData: () => ({
    title: 'React Static',
  }),
  getRoutes: async () => {
    const courses = await getCourses();
    const docs = await getDocs();
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
            section: doc.section,
          }),
        })),
      },
    ];
  },
  plugins: ['plugin'],
  siteRoot: 'https://neo-one.io',
};
