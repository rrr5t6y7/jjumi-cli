import React from 'react'
import getHistory from 'toss.history'
import { route } from 'toss.utils'
import { broadcast } from 'toss.helpers'

export default class BasePage extends React.PureComponent {
  static extend(methods) {
    Object.keys(methods).forEach(methodName => {
      BasePage.prototype[methodName] = methods[methodName]
    })
  }

  constructor(props) {
    super(props)
    this.isAlive = false
    this.pageURLParams = route.getURLParams()
    this.pageMatchParams = this.props.match?.params || {}
    this.state = this.getDefaultState()
  }

  // 实例属性 记录loading
  __loading__ = 0

  // 显示loading界面
  // 此方法要与hideLoading配对使用
  showLoading = () => {
    this.__loading__ += 1
    this.setState({
      loading: true,
    })
  }
  
  // 关闭loading界面
  // 此方法要与showLoading配对使用
  hideLoading = () => {
    this.__loading__ -= 1
    if (this.__loading__ == 0) {
      this.setState({
        loading: false,
      })
    }
  }

  publishBroadcast(message) {
    broadcast.publish(message)
  }

  subscribeBroadcast(messageHandler) {
    broadcast.subscribe(messageHandler)
  }

  unsubscribeBroadcast(messageHandler) {
    broadcast.unsubscribe(messageHandler)
  }

  getDefaultState() {
    return {}
  }

  safeSetState = (...args) => {
    this.isAlive && this.setState(...args)
  }

  navigateTo = url => {
    this.setState(
      {
        willNavigate: true,
      },
      () => {
        getHistory().push(url)
      }
    )
  }

  redirectTo = url => {
    this.setState(
      {
        willNavigate: true,
      },
      () => {
        getHistory().replace(url)
      }
    )
  }

  redirectBack = fallbackUrl => {
    this.setState(
      {
        willNavigate: true,
      },
      () => {
        window?.history.length ? window.history.back() : window.history.replace(fallbackUrl)
      }
    )
  }

  closePage = () => {
    window.close()
  }

  reloadPage = () => {
    window.location.reload()
  }

  componentDidMount() {
    this.isAlive = true
  }

  componentWillUnmount() {
    this.isAlive = false
  }
}
