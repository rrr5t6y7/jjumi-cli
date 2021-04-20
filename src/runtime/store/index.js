/**
 * store 入口
 */

import Rematch from '@rematch/core'
import { connect } from 'react-redux'
import sagaAdapter from './saga'
import global from './global'

/**
 * **状态映射函数，用于通过传入的参数返回所需的状态属性**
 * @param {array|string|object} modelNames
 */
const stateMapper = modelNames => state => {
  if (!modelNames) {
    return { state }
  }

  const returnedState = {}

  if (modelNames instanceof Array) {
    /**
     * *传入字符串数组[string]*
     * 例如 ['user', 'shop', 'city']
     * 则只返回{ user: state.user, shop: state.shop, city: state.city }
     */
    modelNames.forEach(modelName => {
      returnedState[modelName] = state[modelName]
    })
  } else if (typeof modelNames === 'string') {
    /**
     * *传入字符串*
     * 例如 'user'
     * 则只返回{ user: state.user }
     */
    returnedState[modelNames] = state[modelNames]
  } else if (typeof modelNames === 'object') {
    /**
     * *传入对象{[string]: string}*
     * 例如: { user: 'user1', 'city': 'myCity' }
     * 则返回{ user1: state.user, myCity: state.city }
     */
    Object.keys(modelNames).forEach(modelName => {
      returnedState[modelNames[modelName]] = state[modelName]
    })
  }

  return returnedState
}

// 使用saga适配插件兼容saga的effects写法
const plugins = [sagaAdapter()]
// 初始化Redux状态对象
const store = Rematch.init({ models: { global }, plugins })

/**
 * **简易封装的connect**
 * @param {string|string[]|object{[string]:string}} modelNames
 */
const withStore = modelNames => connect(stateMapper(modelNames), dispatch => ({ dispatch }))

/**
 * **注册一个新的model到store中，可以用于在异步加载的模块中注册新的model**
 * @param {object} model 需要扩展的model对象，需要最起码包含name属性和state属性
 */
const registerModel = model => {
  if (!model || (typeof model.name !== 'string' && typeof model.namespace !== 'string')) {
    throw new TypeError('Expect model to be an object with both name and state properties.')
  }

  if (store.getState()[model.name || model.namespace]) {
    console.warn(`Model with name '${model.name || model.namespace}' has already been registered.`)
    return false
  }

  model.name = model.name || model.namespace
  store.model(model)
}

const cancelDispatch = function(dispatchTask) {
  if (dispatchTask && dispatchTask.then && dispatchTask.cancel) {
    return dispatchTask.cancel()
  }

  return false
}

export { connect, withStore, registerModel, cancelDispatch }
export default store
