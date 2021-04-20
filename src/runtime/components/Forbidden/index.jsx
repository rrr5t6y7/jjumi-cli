import React from 'react'
import BasePage from 'toss.components/BasePage'
import './styles.scss'

class Forbidden extends BasePage {
  render() {
    return (
      <div className="page-standard page-forbidden">
        <div className="component-forbidden">
          <span className="forbidden-text">{this.props.text}</span>
        </div>
      </div>
    )
  }
}

Forbidden.defaultProps = {
  text: '哎呀，您没有访问权限...',
}

export default Forbidden
