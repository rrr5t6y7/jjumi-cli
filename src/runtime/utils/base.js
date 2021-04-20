/**
 * 通用基础函数
 * @author 王刚(Margox Wang)
 * @date 2019-05-08
 */

export const copyText = text => {
  const tempInput = document.createElement('textarea')

  tempInput.style.cssText = 'position:absolute;top:0;opacity:0;'
  document.body.appendChild(tempInput)
  tempInput.value = text
  tempInput.select()

  const isCopySuccess = document.execCommand('Copy')
  document.body.removeChild(tempInput)

  return isCopySuccess
}

export const delay = timeout =>
  new Promise(resolve => {
    setTimeout(resolve, timeout)
  })

export const sleep = delay

export const generateUnid = (function (prefix = '') {
  let uniqueIdIndex = 0
  return function () {
    return `${prefix}${(
      Math.random()
        .toString(13)
        .split('.')[1] || ''
    ).slice(0, 8)}${(uniqueIdIndex += 1)}`
  }
})()

export const generateUniNumber = (function (min = 1000) {
  let uniqueIdIndex = 0
  return function () {
    return Math.ceil(`${min + Math.random() * 100000}${(uniqueIdIndex += 1)}`)
  }
})()

export const generateRange = length => {
  return new Array(length).fill(0).map((_, index) => index + 1)
}

export const tryExecute = (object, ...argus) => {
  return typeof object === 'function' ? object(...argus) : object
}

export const noop = () => { }

export const preventableFn = (event, ...argus) => {
  return new Promise((resolve, reject) => {
    if (typeof event === 'function') {
      const executeResult = event(...argus)
      if (executeResult === false) {
        reject(false)
      } else if (event.then || event.catch) {
        return event
      } else {
        resolve(executeResult)
      }
    } else if (event === false) {
      reject(false)
    } else {
      resolve(event)
    }
  })
}

export const importScript = ((oHead, self) => sSrc =>
  new Promise((resolve, reject) => {
    if (self.__cacheImportScript__ && self.__cacheImportScript__[sSrc]) {
      resolve()
    } else {
      var oScript = document.createElement('script')
      oScript.type = 'text/javascript'
      oScript.charset = 'utf-8'
      oScript.onerror = () => {
        reject(new URIError('The script ' + sSrc + ' is not accessible.'))
      }
      oScript.onload = () => {
        if (!self.__cacheImportScript__) {
          self.__cacheImportScript__ = {}
        }
        self.__cacheImportScript__[sSrc] = sSrc
        resolve()
      }
      oHead.appendChild(oScript)
      oScript.src = sSrc
    }
  }))(document.head || document.getElementsByTagName('head')[0], window)

/**
 * 为Promise包装一个cancel方法，让其变得可取消
 * @param {Promise} promise
 * @returns {Promise}
 */
export const makeCancelablePromise = promise => {
  let rejectFn

  const wrappedPromise = new Promise((resolve, reject) => {
    rejectFn = reject

    Promise.resolve(promise)
      .then(resolve)
      .catch(reject)
  })

  wrappedPromise.cancel = () => {
    promise.__canceled = true
    rejectFn({ canceled: true })
  }

  return wrappedPromise
}


export const isIE = () => {
  if (!!window.ActiveXObject || "ActiveXObject" in window) {
    return true;
  } else {
    return false;
  }
}

export default {
  sleep,
  delay,
  generateUnid,
  generateUniNumber,
  generateRange,
  copyText,
  tryExecute,
  noop,
  isIE,
  importScript,
  makeCancelablePromise,
}
