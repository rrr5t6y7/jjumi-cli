import eventEmitter from 'toss.helpers/events'

const channelName = 'toss-broadcast-channel'
let broadcastChannel = null

export const init = () => {
  if (typeof BroadcastChannel === 'function' && !broadcastChannel) {
    broadcastChannel = new BroadcastChannel(channelName)
    broadcastChannel.onmessage = event => {
      eventEmitter.emit(channelName, event.data || {})
    }
  }
}

export const publish = message => {
  broadcastChannel && broadcastChannel.postMessage(message)
}

export const subscribe = eventHandler => {
  return eventEmitter.on(channelName, eventHandler)
}

export const unsubscribe = eventHandler => {
  return eventEmitter.off(channelName, eventHandler)
}

export default {
  init,
  publish,
  subscribe,
  unsubscribe,
}
