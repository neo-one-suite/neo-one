const React = require('react');
const siteConfig = require(process.cwd() + '/siteConfig.js');
const translate = require('../../server/translate.js').translate;

class HorizontalTitleContainer extends React.Component {
  render() {
    return (
      <div className="horizontalTitle">
        <div className={'horizontalTitleLeft headline axiformaMedium ' + (this.props.titleClassName || '')}>
          {this.props.title}
        </div>
        <div className="horizontalTitleRight axiformaRegular">{this.props.content}</div>
      </div>
    );
  }
}

class Hero extends React.Component {
  render() {
    return (
      <div className="heroBackground sectionBottom">
        <div className="hero wrapper">
          <div className="tagLineContainer colContainer">
            <div className="heroContainer colContainer sectionTop">
              <div className="heroLeftInner paddingTop1">
                <img src={siteConfig.baseUrl + 'img/tagline.svg'} alt="Wake up NEO" />
              </div>
            </div>
            <div className="heroContainer colContainer sectionTop">
              <div className="heroRightInner">
                <div className="tagLineText display1 axiformaRegular">
                  <translate>The One for easy, fast, & fun NEO app development.</translate>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Intro extends React.Component {
  render() {
    return (
      <div className="gray0BG section">
        <div className="wrapper colContainer">
          <HorizontalTitleContainer
            titleClassName="primaryDark"
            title={<translate>Coming soon!</translate>}
            content={
              <div>
                <div className="subheading axiformaRegular">
                  <translate>Come back later this week for the beta release of NEO•ONE!</translate>
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }
}

class Index extends React.Component {
  render() {
    const language = this.props.language || 'en';
    return (
      <div>
        <Hero language={language} />
        <Intro language={language} />
      </div>
    );
  }
}

module.exports = Index;
