const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */

const translate = require('../../server/translate.js').translate;

const siteConfig = require(process.cwd() + '/siteConfig.js');

class Button extends React.Component {
  render() {
    return (
      <a className={'button buttonText ' + (this.props.className || '')} href={this.props.href} target={this.props.target}>
        {this.props.children}
      </a>
    );
  }
}

Button.defaultProps = {
  target: '_self',
};

class GetStartedButton extends React.Component {
  render() {
    return (
      <Button
        className={'heroButton ' + (this.props.className || '')}
        href={
          siteConfig.baseUrl +
          'docs/' +
          this.props.language +
          '/installation.html'
        }>
        <translate>Get Started</translate>
      </Button>
    );
  }
}

class HorizontalTitleContainer extends React.Component {
  render() {
    return (
      <div className="horizontalTitle">
        <div className={'horizontalTitleLeft headline axiformaMedium ' + (this.props.titleClassName || '')}>
          {this.props.title}
        </div>
        <div className="horizontalTitleRight axiformaRegular">
          {this.props.content}
        </div>
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
                <img
                  src={siteConfig.baseUrl + 'img/tagline.svg'}
                  alt='Wake up NEO'
                />
              </div>
            </div>
            <div className="heroContainer colContainer sectionTop">
              <div className="heroRightInner">
                <div className="tagLineText display1 axiformaRegular">
                  <translate>The One for easy, fast, & fun NEO app development.</translate>
                </div>
                <div className="heroButtonContainer">
                  <Button className="heroButton heroButtonLeft" href="#try">
                    <translate>Try It Out</translate>
                  </Button>
                  <GetStartedButton
                    className="heroButtonMiddle"
                    language={this.props.language}
                  />
                  <Button
                    className="heroButton heroButtonRight"
                    href='https://github.com/neo-one-suite/neo-one'>
                    GitHub
                  </Button>
                </div>
                <div className="githubContainer">
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
          </div>
        </div>
      </div>
    )
  }
}

class Intro extends React.Component {
  render() {
    return (
      <div className="gray0BG section">
        <div className="wrapper colContainer">
          <HorizontalTitleContainer
            titleClassName="primaryDark"
            title={<translate>It's time to remove the veil.</translate>}
            content={
              <div>
                <div className="subheading axiformaRegular">
                  <translate>
                  Choose NEO•ONE, and make coding, testing and deploying your NEO
                  blockchain solutions easier, faster, more efficient and much more
                  satisfying. With our painless, end-to-end, fully integrated and
                  elevated developer experience, the world of NEO is yours.
                  </translate>
                </div>
                <div className="subheading axiformaRegular paddingTopHalf">
                  <translate>
                  Or… you can continue to use other NEO solutions SDKs and be none the wiser.
                  </translate>
                </div>
                <div className="subheading axiformaRegular paddingTopHalf">
                  <translate>
                  The choice is yours.
                  </translate>
                </div>
                <div className="subheadingBold axiformaSemiBold paddingTopHalf">
                  <translate>
                  Are you ready to kick some apps?
                  </translate>
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }
}

class FeaturesIntro extends React.Component {
  render() {
    return (
      <HorizontalTitleContainer
        titleClassName="primaryLight"
        title={<translate>Bend spoons with ease.</translate>}
        content={
          <div className="subheading gray1">
            <translate>
              Our full arsenal of tools helps you overcome NEO blockchain obstacles, offering effortless
              start up and application that lets you create, test, deploy and interact with your first
              contract within 30 minutes.
            </translate>
          </div>
        }
      />
    );
  }
}

class Feature extends React.Component {
  render() {
    return (
      <div className="featWrapper">
        <div className="feature">
          <div className="featureImage">
            <img
              src={siteConfig.baseUrl + this.props.image}
              alt={this.props.title}
            />
          </div>
          <div className="colContainer">
            <div className="featureNumber">
              <img
                src={siteConfig.baseUrl + this.props.number}
                alt={this.props.index}
              />
            </div>
            <div className="featureTitle primaryLight decimaLight">
              {this.props.title.map(
                (value, idx) => <div key={value} className={idx === 0 ? undefined : 'featureTitleText'}>{value}</div>
              )}
            </div>
          </div>
          <div className="subheading gray1 paddingTop2 axiformaBook">
            {this.props.text}
          </div>
        </div>
      </div>
    );
  }
}

class CallOut extends React.Component {
  render() {
    return (
      <div className="featWrapper">
        <div className="feature featuresCallOut">
          <div className="headline accent axiformaMedium">
            <translate>Cryptocurrency may be serious business, but the act of creating and working with it doesn’t have to be.</translate>
          </div>
          <div className="subheading gray3 paddingTop2 axiformaRegular">
            <translate>NEO•ONE makes both coding and implementing Neo blockchain painless and fun.</translate>
          </div>
          <div className="paddingTop2 calloutButton">
            <GetStartedButton language={this.props.language} />
          </div>
        </div>
      </div>
    );
  }
}

class Features extends React.Component {
  render() {
    return (
      <div className="blackBG section">
        <div className="wrapper featureWrapper">
          <FeaturesIntro language={this.props.language} />
          <div className="featureContainer">
            <Feature
              language={this.props.language}
              index={1}
              number="img/number1.svg"
              image="img/network.svg"
              title={[<translate>network</translate>, <translate>management</translate>]}
              text={<translate>Get plugged in by instantly setting up and deploying a private network with plenty of NEO and GAS to play with.</translate>}
            />
            <Feature
              language={this.props.language}
              index={2}
              number="img/number2.svg"
              image="img/smartcontract.svg"
              title={[<translate>smart</translate>, <translate>contract</translate>, <translate>development</translate>]}
              text={<translate>Move fluidly through programs to develop, compile and deploy smart contracts in JavaScript, Python or C# with speed and agility.</translate>}
            />
            <Feature
              language={this.props.language}
              index={3}
              number="img/number3.svg"
              image="img/testing.svg"
              title={[<translate>automated</translate>, <translate>contract</translate>, <translate>testing</translate>]}
              text={<translate>Commence the training sequence and test using the NEO•ONE cli. Write JavaScript unit tests to automate testing for rapid development.</translate>}
            />
            <Feature
              language={this.props.language}
              index={4}
              number="img/number4.svg"
              image="img/debugging.svg"
              title={[<translate>debugging</translate>]}
              text={<translate>Stick it to squiddies with our integrated debugger that lets you step through smart contract code just like any other programming language.</translate>}
            />
            <Feature
              language={this.props.language}
              index={5}
              number="img/number5.svg"
              image="img/client.svg"
              title={[<translate>client</translate>]}
              text={<translate>Interact with NEO and smart contracts in a human-friendly way, with documentation that’s simple to follow and understand.</translate>}
            />
            <CallOut language={this.props.language} />
          </div>
        </div>
      </div>
    )
  }
}

class FeaturesOutro extends React.Component {
  render() {
    return (
      <div className="primaryLightBG section" id="try">
        <div className="wrapper colContainer">
          <HorizontalTitleContainer
            titleClassName="gray5"
            title={<translate>Try it out. Free your mind.</translate>}
            content={
              <div>
                <div className="subheading axiformaRegular">
                  <translate>
                  Install NEO•ONE directly from npm and let it expand your ability to
                  code and implement NEO blockchain solutions on Linux, Mac OS and Windows
                  with NodeJS 8.9.0+.
                  </translate>
                </div>
                <div className="install paddingTop2 paddingBottom2">
                <div className="installCode">
                <MarkdownBlock>{
        `\`\`\`
npm install -g @neo-one/cli
\`\`\``
                }</MarkdownBlock>
                </div>
                </div>
                <div className="subheadingBold axiformaSemiBold">
                  <translate>
                    Success is not impossible. It’s inevitable.
                  </translate>
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }
}

class FeatureCallout extends React.Component {
  render() {
    const left = (
      <div className={'featureCalloutImage'}>
        <img
          src={siteConfig.baseUrl + this.props.image}
          alt={this.props.title}
        />
      </div>
    );

    const right = (
      <div className={'featureCalloutText'}>
        <div className="headline gray6 axiformaMedium">
          {this.props.title}
        </div>
        <div className="subheading gray6 paddingTop2 axiformaRegular">
          {this.props.description}
        </div>
      </div>
    );

    const className = "section " + this.props.className;

    if (this.props.ltr) {
      return (
        <div className={className}>
          <div className="wrapper featureCallout featureCalloutLTR">
            {left}
            {right}
          </div>
        </div>
      );
    }

    return (
      <div className={className}>
        <div className="wrapper featureCallout">
          {right}
          {left}
        </div>
      </div>
    );
  }
}

class Believers extends React.Component {
  render() {
    const showcase = siteConfig.users
      .filter(user => {
        return user.pinned;
      })
      .map(user => {
        return (
          <a key={user.caption} href={user.infoLink}>
            <img src={user.image} title={user.caption} />
          </a>
        );
      });

    return (
      <div className="gray05BG section">
        <div className="wrapper believersContainer productShowcaseSection">
          <HorizontalTitleContainer
            titleClassName="primaryDark"
            title={<translate>Who believes in NEO•ONE?</translate>}
            content={
              <div className="subheading axiformaRegular">
                <translate>
                NEO•ONE powers decentralized apps and NEO blockchain integrations
                for a broad range of projects. See who believes here.
                </translate>
              </div>
            }
          />
          <div className="logos logosShowcase">{showcase}</div>
          <div className="more-users">
            <Button href={siteConfig.baseUrl + this.props.language + '/' + 'users.html'}>
              <translate>More believers</translate>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

class Final extends React.Component {
  render() {
    return (
      <div className="gray5BG section">
        <div className="wrapper">
          <HorizontalTitleContainer
            titleClassName="primaryLight"
            title={
              <div>
                <div>
                  <translate>
                  We've taken you this far.
                  </translate>
                </div>
                <div>
                  <translate>
                  The rest is up to you.
                  </translate>
                </div>
              </div>
            }
            content={
              <div className="finalContainer">
                <div>
                  <div className="subheading gray1 axiformaRegular">
                    <translate>
                      The veil of complexity has been removed and your path is clear.
                    </translate>
                  </div>
                  <div className="subheading paddingTopHalf gray1 axiformaRegular">
                    <translate>
                      Let NEO•ONE take you to a new world of capabilities and success
                      with NEO blockchain app development.
                    </translate>
                  </div>
                </div>
                <div>
                  <GetStartedButton language={this.props.language} />
                </div>
              </div>
            }
          />
        </div>
      </div>
    )
  }
}

class Index extends React.Component {
  render() {
    const language = this.props.language || 'en';
    return (
      <div>
        <Hero language={language} />
        <Intro language={language} />
        <Features language={language} />
        <FeaturesOutro language={language} />
        <FeatureCallout
          className="gray0BG"
          image="img/simulations.png"
          title={<translate>NEO•ONE simulations</translate>}
          description={<translate>Learn to harness your NEO powers with tutorial simulations that interactively guide you and teach core decentralized app development concepts. Plus, pre-configured, template simulations bootstrap a decentralized app.</translate>}
          ltr
          language={language}
        />
        <FeatureCallout
          className="gray2BG"
          image="img/editors.png"
          title={<translate>Atom and VSCode integration</translate>}
          description={<translate>Overcome obstacles with the power of the NEO•ONE cli directly in your editor. Debugger integration lets you troubleshoot and step through code within your favorite editors with ease.</translate>}
          language={language}
        />
        <FeatureCallout
          className="gray0BG"
          image="img/plugins.png"
          title={<translate>NEO•ONE plugins</translate>}
          description={<translate>Extend the functionality and power of NEO•ONE across all worlds with plugins designed to make decentralized app development even easier. Plus, a NEO Tracker plugin extends your vision to explore private networks.</translate>}
          ltr
          language={language}
        />
        <Believers language={language} />
        <Final language={language} />
      </div>
    );
  }
}

module.exports = Index;
