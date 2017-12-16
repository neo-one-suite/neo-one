const users = [
  {
    caption: 'NEO Tracker',
    image: '/img/neotracker.png',
    infoLink: 'https://neotracker.io',
    pinned: true,
  },
];

const siteConfig = {
  title: 'NEO•ONE',
  tagline: 'The One suite of tools for developing NEO dapps',
  url: 'https://neo-one.io',
  baseUrl: '/',
  organizationName: 'neo-one-suite',
  projectName: 'neo-one',
  headerLinks: [
    { doc: 'contributing', label: 'Contributing' },
    { page: 'help', label: 'Help' },
    { blog: true, label: 'Blog' },
  ],
  users,
  headerIcon: 'img/docusaurus.svg',
  footerIcon: 'img/docusaurus.svg',
  favicon: 'img/favicon.png',
  colors: {
    primaryColor: '#2E8555',
    secondaryColor: '#205C3B',
  },
  copyright:
    // eslint-disable-next-line
    'Copyright © ' +
    new Date().getFullYear() +
    ' NEO ONE',
  highlight: {
    theme: 'default',
  },
  scripts: ['https://buttons.github.io/buttons.js'],
  repoUrl: 'https://github.com/neo-one-suite/neo-one',
  editUrl: 'https://github.com/neo-one-suite/neo-one/edit/master/docs/',
  gaTrackingId: 'UA-92599752-3',
  facebookAppId: 1764807046864916,
  twitter: true,
  cname: 'neo-one.io',
};

module.exports = siteConfig;
