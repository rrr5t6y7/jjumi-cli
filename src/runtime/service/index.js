import request from 'toss.utils/request'

let backendServicePrefix = '/api'

const localServices = {}
const extendRequestHandlers = []
const extendResponseHandlers = []

const setBackendServicePrefix = nextBackendServicePrefix => {
  backendServicePrefix = nextBackendServicePrefix
}

const useRequestHandler = handler => {
  extendRequestHandlers.push(handler)
}

const useResponseHandler = handler => {
  extendResponseHandlers.push(handler)
}

const resolveRequestParam = originRequestParams => {
  return extendRequestHandlers.reduce((handledData, handler) => handler(handledData), originRequestParams)
}

const resolveResponseData = (originResponseData, requestParams, xhr) => {
  return extendResponseHandlers.reduce((handledData, handler) => handler(handledData, requestParams, xhr), originResponseData)
}

const registerLocalService = (type, handler) => {
  localServices[type] = handler
}

const isLocalService = type => {
  return !!localServices[type]
}

const runLocalService = async (type, ...params) => {
  if (localServices[type]) {
    return await localServices[type](...params)
  }
  return false
}

let serviceMap

try {
  serviceMap = require('.services.js')
} catch (error) {
  console.warn(error)
}

/**
 * 生成请求方法
 *
 * @param {*} type 请求类型
 * @param {*} body 请求参数，get会将请求参数拼接在URL中
 * @param {*} urlParameter  URL中的参数，
 */
const requestService = (serviceName, data, urlParameter, params = {}) => {
  let serviceInfo = serviceMap[serviceName]
  const { isDownload, ...restParams } = params

  if (isLocalService(serviceName)) {
    return runLocalService(serviceName, data, urlParameter, (params = {}))
  }

  if (!serviceInfo) {
    return Promise.reject({
      code: 404,
      data: null,
      messaeg: `无法匹配名为${serviceName} 的服务配置`,
    })
  }

  // 去掉多余的空格
  serviceInfo = serviceInfo.trim().replace(/\s+/g, ' ')

  // 默认method 为 post
  let serviceInfoArry = serviceInfo.split(' ')
  if (serviceInfoArry.length === 1) {
    serviceInfoArry.unshift('post')
  }

  let [method = '', url = ''] = serviceInfoArry

  // 替换url的参数
  urlParameter &&
    Object.keys(urlParameter).forEach(key => {
      url = url.replace(`:${key}`, urlParameter[key])
    })

  restParams.method = method
  restParams.urlPrefix = restParams.urlPrefix ? restParams.urlPrefix : restParams.urlPrefix === '' ? '' : backendServicePrefix
  restParams.responseHandler = restParams.responseHandler
    ? (response, param, xhr) => restParams.responseHandler(resolveResponseData(response, param, xhr), param, xhr)
    : resolveResponseData
  const resolvedParams = resolveRequestParam({ url, data, ...restParams })

  if (resolvedParams === false) {
    return false
  }

  if (isDownload) {
    return request.download(resolvedParams.url, resolvedParams.data, resolvedParams)
  } else {
    return request(resolvedParams)
  }
}

requestService.download = (serviceName, data, urlParameter, params) =>
  requestService(serviceName, data, urlParameter, {
    ...params,
    isDownload: true,
  })

requestService.create = serviceName => (...params) => requestService(serviceName, ...params)

const createRequest = requestService

const requestURI = (url, data, params = {}) => {
  const { isDownload, ...restParams } = params

  restParams.urlPrefix = restParams.urlPrefix ? restParams.urlPrefix : restParams.urlPrefix === '' ? '' : backendServicePrefix
  restParams.responseHandler = restParams.responseHandler
    ? (response, param, xhr) => restParams.responseHandler(resolveResponseData(response, param, xhr), param, xhr)
    : resolveResponseData

  const resolvedParams = resolveRequestParam({ url, data, ...restParams })

  if (resolvedParams === false) {
    return false
  }

  if (isDownload) {
    return request.download(resolvedParams.url, resolvedParams.data, resolvedParams)
  } else {
    return request(resolvedParams)
  }
}

requestURI.get = (url, data, params) => requestURI(url, data, { ...params, method: 'get' })
requestURI.post = (url, data, params) => requestURI(url, data, { ...params, method: 'post' })
requestURI.download = (url, data, params) => requestURI(url, data, { ...params, isDownload: true })

export { registerLocalService, setBackendServicePrefix, useRequestHandler, useResponseHandler, requestURI, requestService, createRequest }
