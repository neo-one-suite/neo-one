/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const translate = require('../../server/translate.js').translate;
const translation = require('../../server/translation.js');

const siteConfig = require(process.cwd() + '/siteConfig.js');

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: '_self',
};

class HomeSplash extends React.Component {
  render() {
    return (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">
            <div className="projectLogo">
              <img
                src={siteConfig.baseUrl + 'img/neo.svg'}
                alt='NEO•ONE'
              />
            </div>
            <div className="inner">
              <h2 className="projectTitle">
                {siteConfig.title}
                <small>{
                  translation[this.props.language]['localized-strings']
                    .tagline
                }</small>
              </h2>
              <div className="section promoSection">
                <div className="promoRow">
                  <div className="pluginRowBlock">
                    <Button href="#try">
                      <translate>Try</translate>
                    </Button>
                    <Button
                      href={
                        siteConfig.baseUrl +
                        'docs/' +
                        this.props.language +
                        '/installation.html'
                      }>
                      <translate>Get Started</translate>
                    </Button>
                    <Button href='https://github.com/neo-one-suite/neo-one'>
                      GitHub
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="githubButton" style={{minHeight: '20px'}}>
              <a
                className="github-button"
                href={siteConfig.repoUrl}
                data-icon="octicon-star"
                data-count-href="/neo-one-suite/neo-one/stargazers"
                data-show-count={true}
                data-count-aria-label="# stargazers on GitHub"
                aria-label="Star neo-one-suite/neo-one on GitHub"
              >
                Star
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Index extends React.Component {
  render() {
    let language = this.props.language || 'en';
    const showcase = siteConfig.users
      .filter(user => {
        return user.pinned;
      })
      .map(user => {
        return (
          <a href={user.infoLink}>
            <img src={user.image} title={user.caption} />
          </a>
        );
      });

    return (
      <div>
        <HomeSplash language={language} />
        <Container padding={[]}>
        <MarkdownBlock>{
`> NEO•ONE is under active development and this website is still under construction. Many of the features described here are in progress. Check back soon for the 1.0.0 release! Want to help? Head on over to the [Contributing page](${siteConfig.baseUrl +
                'docs/' +
                language +
                '/contributing.html'}) to get started.`
        }</MarkdownBlock>
      </Container>
        <div className="mainContainer">
          <Container padding={['bottom', 'top']}>
            <GridBlock
              align="center"
              contents={[
                {
                  content: <translate>Instant private network setup and deployment with ample NEO and GAS to experiment with.</translate>,
                  image: siteConfig.baseUrl + 'img/content/network.svg',
                  imageAlign: 'top',
                  title: <translate>Network Management</translate>
                },
                {
                  content: <translate>Develop, compile and deploy Smart Contracts in JavaScript, Python or C#.</translate>,
                  image: siteConfig.baseUrl + 'img/content/contract.svg',
                  imageAlign: 'top',
                  title: <translate>Smart Contract Development</translate>,
                },
                {
                  content: <translate>Test using the NEO•ONE cli. Write JavaScript unit tests to automate testing for rapid development.</translate>,
                  image: siteConfig.baseUrl + 'img/content/test.svg',
                  imageAlign: 'top',
                  title: <translate>Automated Contract Testing</translate>,
                },
              ]}
              layout="threeColumn"
            />
            <br />
            <br />
            <GridBlock
              align="center"
              contents={[
                {
                  content: <translate>Integrated debugger for stepping through Smart Contract code just like any other programming language.</translate>,
                  image: siteConfig.baseUrl + 'img/content/debugger.svg',
                  imageAlign: 'top',
                  title: <translate>Debugging</translate>
                },
                {
                  content: <translate>Human friendly client APIs for interacting with NEO and your Smart Contract.</translate>,
                  image: siteConfig.baseUrl + 'img/content/client.svg',
                  imageAlign: 'top',
                  title: <translate>Client APIs</translate>,
                },
              ]}
              layout="twoColumn"
            />
          </Container>

          <Container padding={['bottom', 'top']} background="light" id="try">
            <GridBlock
              contents={[
                {
                  content: <translate>Install directly from npm. Works on Linux, macOS and Windows with NodeJS 8.9.0+.</translate>,
                  image: siteConfig.baseUrl + 'img/favicon.png',
                  imageAlign: 'right',
                  title: <translate>Try it out!</translate>,
                },
              ]}
            />
          </Container>

          <Container padding={['bottom', 'top']}>
            <GridBlock
              contents={[
                {
                  content: <translate>Get started quickly with NEO•ONE Simulations. Tutorial Simulations interactively teach core decentralized app development concepts. Pre-configured template Simulations bootstrap a decentralized app.</translate>,
                  image: siteConfig.baseUrl + 'img/favicon.png',
                  imageAlign: 'left',
                  title: <translate>NEO•ONE Simulations</translate>,
                },
              ]}
            />
          </Container>

          <Container padding={['bottom', 'top']} background="dark">
            <GridBlock
              contents={[
                {
                  content: <translate>All of the power of the NEO•ONE cli directly in your editor. Debugger integration lets you step through the code from within your favorite editors.</translate>,
                  image: siteConfig.baseUrl + 'img/favicon.png',
                  imageAlign: 'right',
                  title: <translate>Atom and VSCode Integration</translate>
                },
              ]}
            />
          </Container>

          <Container padding={['bottom', 'top']}>
            <GridBlock
              contents={[
                {
                  content: <translate>Extend the functionality of NEO•ONE with plugins designed to make decentralized app development even easier. The NEO Tracker plugin provides the full power of NEO Tracker for exploring private networks.</translate>,
                  image: siteConfig.baseUrl + 'img/favicon.png',
                  imageAlign: 'left',
                  title: <translate>NEO•ONE Plugins</translate>
                },
              ]}
            />
          </Container>

          <div className="productShowcaseSection paddingBottom">
            <h2><translate>Who's using NEO•ONE?</translate></h2>
            <p><translate>NEO•ONE powers decentralized apps and NEO blockchain integrations for these projects...</translate></p>
            <div className="logos">{showcase}</div>
            <div className="more-users">
              <a
                className="button"
                href={
                  siteConfig.baseUrl + this.props.language + '/' + 'users.html'
                }>
                <translate>More NEO•ONE Users</translate>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Index;
