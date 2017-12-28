const users = [
  {
    caption: 'NEO Tracker',
    image: '/img/neotracker.png',
    infoLink: 'https://neotracker.io',
    pinned: true,
  },
];

const repoUrl = 'https://github.com/neo-one-suite/neo-one';

const siteConfig = {
  title: 'NEO•ONE',
  tagline: 'Delightful NEO Decentralized App Development',
  url: 'https://neo-one.io',
  baseUrl: '/',
  organizationName: 'neo-one-suite',
  projectName: 'neo-one',
  headerLinks: [
    { doc: 'installation', label: 'Docs' },
    { page: 'help', label: 'Help' },
    { blog: true, label: 'Blog' },
    { href: repoUrl, label: 'GitHub' },
    { languages: true },
    // { search: true },
  ],
  users,
  headerIcon: 'img/neo.svg',
  footerIcon: 'img/neo.svg',
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
  repoUrl,
  editUrl: repoUrl + '/edit/master/docs/',
  gaTrackingId: 'UA-92599752-3',
  facebookAppId: 1764807046864916,
  twitter: true,
  cname: 'neo-one.io',
};

module.exports = siteConfig;
