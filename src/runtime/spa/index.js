import { registerApplication, start } from 'single-spa'
import singleSpaReact from 'single-spa-react'

const pathStartsWith = (prefix) => {
  return function(location) {
    return location.pathname.startsWith(`${prefix}`);
  }
}

const getAppHostNode = (queryString) => () => {
  if (queryString instanceof HTMLElement) {
    return queryString
  } else if (typeof queryString === 'function') {
    return queryString()
  } else {
    return document.querySelector(queryString)
  }
}

export default {
  createReactApp: (options) => {
    const reactApp = singleSpaReact({
      React: options.React,
      ReactDOM: options.ReactDOM,
      rootComponent: options.component,
      domElementGetter: getAppHostNode(options.hostNode),
    })

    return {
      bootstrap (props) {
        options.bootstrap && options.bootstrap(props)
        return reactApp.bootstrap(props)
      },
      mount (props) {
        options.mount && options.mount(props)
        return reactApp.mount(props)
      },
      unmount (props) {
        options.unmount && options.unmount(props)
        return reactApp.unmount(props)
      },
    }
  },
  registerSubApps: (subApps) => {
    if (Array.isArray(subApps)) {
      subApps.forEach(subApp => {
        registerApplication(
          subApp.name,
          () => import(subApp.entry),
          pathStartsWith(subApp.pathPrefix)
        )
      })
    } else {
      registerApplication(
        subApps.name,
        () => import(subApps.entry),
        pathStartsWith(subApps.pathPrefix)
      )
    }
  },
  start: start
}