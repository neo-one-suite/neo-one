const users = [
  {
    caption: 'NEO Tracker',
    image: '/img/neotracker.png',
    infoLink: 'https://neotracker.io',
    pinned: true,
  },
];

const repoUrl = 'https://github.com/neo-one-suite/neo-one';

const backup = [
  '-apple-system',
  'system-ui',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Oxygen',
  'Ubuntu',
  'Cantarell',
  'Fira Sans',
  'Droid Sans',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
];

const axiforma = (font) => [
  font,
  'Questrial',
].concat(backup);

const decima = (font) => [
  font,
  'Cutive Mono',
].concat(backup);

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
  headerIcon: 'img/logo.svg',
  mobileHeaderIcon: 'img/mobileLogo.svg',
  disableHeaderTitle: true,
  footerIcon: 'img/monogram.svg',
  favicon: 'favicon.ico',
  colors: {
    // primaryColor: '#00d180',
    primaryColor: '#00FF9C',
    secondaryColor: '#205C3B',
    // codeColor: '#205C3B',
    primaryDark: '#00d180',
    primaryLight: '#00FF9C',
    black: '#2E2837',
    accent: '#9B98F6',
    error: '#FF466A',
    gray0: '#F8F5FD',
    grayHalf: '#F2EEF7',
    gray1: '#F2EAFE',
    gray2: '#CCBEE0',
    gray3: '#8E82A3',
    gray4: '#5B506B',
    gray5: '#40384C',
    gray6: '#362E43',
    hover: '#00d180',
  },
  copyright:
    // eslint-disable-next-line
    'Copyright © ' +
    new Date().getFullYear() +
    ' NEO•ONE',
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
  fonts: {
    axiformaBold: axiforma('Axiforma-Bold'),
    axiformaRegular: axiforma('Axiforma-Regular'),
    axiformaMedium: axiforma('Axiforma-Medium'),
    axiformaSemiBold: axiforma('Axiforma-SemiBold'),
    axiformaBook: axiforma('Axiforma-Book'),
    decimaMonoProLt: decima('DecimaMonoProLt'),
  }
};

module.exports = siteConfig;
