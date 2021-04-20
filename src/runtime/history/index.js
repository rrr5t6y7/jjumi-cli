import { createBrowserHistory, createHashHistory } from 'history'

let historyInitialized = false
let history = createBrowserHistory({ basename: '/' })

export const createHistory = (type = 'browserHistory', options = { basename: '/' }) => {
  if (historyInitialized) {
    return history
  }

  historyInitialized = true
  return (history = type === 'browserHistory' ? createBrowserHistory(options) : createHashHistory(options))
}

export default () => history
