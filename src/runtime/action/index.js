import store from '../store'
import { getHistory } from '../history'

const actions = {}

export const getActions = actionName => (actionName ? actions[actionName] : actions)

export const addAction = (actionName, actionCreator) => {
  actions[actionName] = actions[actionName] || []
  const action = actionCreator({ store, history: getHistory() })
  typeof action === 'function' && actions[actionName].push()
}

export const emitAction = (actionName, ...argus) => {
  action[actionName] && action[actionName].forEach(action => action(argus))
}

export const removeAction = (actionName, action) => {
  if (actionName && actions[actionName]) {
    if (action) {
      actions[actionName] = actions[actionName].filter(item => item !== action)
    } else {
      delete actions[actionName]
    }
  }
}

export default {
  getActions,
  addAction,
  emitAction,
  removeAction,
}
