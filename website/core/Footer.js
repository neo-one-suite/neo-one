/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class FooterLink extends React.Component {
  render() {
    return (
      <a className="footerLink" href={this.props.link} target={this.props.target}>
        <img
          className="footerLinkImage footerLinkRestImage"
          src={this.props.config.baseUrl + 'img/footer/' + this.props.image}
          alt={this.props.title}
        />
        <img
          className="footerLinkImage footerLinkHoverImage"
          src={this.props.config.baseUrl + 'img/footer/' + this.props.hoverImage}
          alt={this.props.title}
        />
        <div className="body1 gray0 footerLinkText axiformaRegular">
          {this.props.title}
        </div>
      </a>
    )
  }
}

class Footer extends React.Component {
  render() {
    const currentYear = new Date().getFullYear();
    return (
      <footer className="nav-footer footerContainer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            <img
              src={this.props.config.baseUrl + this.props.config.footerIcon}
              alt={this.props.config.title}
              width="66"
              height="58"
            />
          </a>
          <div className="footerSectionWrapper">
            <div className="footerSection">
              <h5 className="body1 footerTitle axiformaBold">DOCS</h5>
              <FooterLink
                config={this.props.config}
                link={
                  this.props.config.baseUrl +
                  'docs/' +
                  this.props.language +
                  '/installation.html'
                }
                title="Getting Started"
                image="getting-started.svg"
                hoverImage="getting-started-hover.svg"
              />
              <FooterLink
                config={this.props.config}
                link={
                  this.props.config.baseUrl +
                  'docs/' +
                  this.props.language +
                  '/contributing.html'
                }
                title="Contribute"
                image="contribute.svg"
                hoverImage="contribute-hover.svg"
              />
            </div>
          </div>
          <div className="footerSectionWrapper">
            <div className="footerSection">
              <h5 className="body1 footerTitle axiformaBold">COMMUNITY</h5>
              <FooterLink
                config={this.props.config}
                link={
                  this.props.config.baseUrl +
                  this.props.language +
                  '/users.html'
                }
                title="User Showcase"
                image="user-showcase.svg"
                hoverImage="user-showcase-hover.svg"
              />
              <FooterLink
                config={this.props.config}
                link="https://discord.gg/S86PqDE"
                target="_blank"
                title="NEO•ONE Chat"
                image="chat.svg"
                hoverImage="chat-hover.svg"
              />
              <FooterLink
                config={this.props.config}
                link="http://stackoverflow.com/questions/tagged/neo-one"
                target="_blank"
                title="Stack Overflow"
                image="stack-overflow.svg"
                hoverImage="stack-overflow-hover.svg"
              />
              <FooterLink
                config={this.props.config}
                link="https://twitter.com/neo_one_suite"
                target="_blank"
                title="Twitter"
                image="twitter.svg"
                hoverImage="twitter-hover.svg"
              />
            </div>
          </div>
          <div className="footerSectionWrapper">
            <div className="footerSection">
              <h5 className="body1 footerTitle axiformaBold">MORE</h5>
              <FooterLink
                config={this.props.config}
                link={this.props.config.baseUrl + 'blog'}
                title="Blog"
                image="blog.svg"
                hoverImage="blog-hover.svg"
              />
              <FooterLink
                config={this.props.config}
                link={this.props.config.repoUrl}
                title="GitHub"
                image="github.svg"
                hoverImage="github-hover.svg"
              />
              <div className="footerGitHubButton">
                <a
                  className="github-button"
                  href={this.props.config.repoUrl}
                  data-icon="octicon-star"
                  data-count-href="/neo-one-suite/neo-one/stargazers"
                  data-show-count={true}
                  data-count-aria-label="# stargazers on GitHub"
                  aria-label="Star this project on GitHub">
                  Star
                </a>
              </div>
            </div>
          </div>
        </section>
        <section className="copyright">
          COPYRIGHT &copy; {currentYear} NEO•ONE.
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
