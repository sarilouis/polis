import React from 'react';

class Language extends React.Component {

  constructor(props) {
    super(props);
    this.navTo = this.navTo.bind(this);
  }

  navTo(e) {
    window.location.href = window.location.pathname + "?ui_lang=" + e.target.getAttribute("data-target-lang");
  }

  render() {
    let ar = <a onClick={this.navTo} className="lb flag" data-target-lang="ar_ppl" href="#" />;
    let fr = <a onClick={this.navTo} className="fr flag" data-target-lang="fr_ppl" href="#" />
    let en = <a onClick={this.navTo} className="uk flag" data-target-lang="en_ppl" href="#" />;

    switch (true) {
      case /^ar/.test(window.ui_lang):
        ar = <i className="lb flag" data-active></i>;
        break;
      case /^fr/.test(window.ui_lang):
        fr = <i className="fr flag" data-active></i>;
        break;
      default:
        en = <i className="uk flag" data-active></i>;
    }

    return (
      <span>
        {ar}
        {fr}
        {en}
      </span>
    );
  }
}

export default Language;
