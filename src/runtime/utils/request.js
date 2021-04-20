import { useState, useEffect } from 'react'
import { base, route, validate } from 'toss.utils'

const requestCache = {}

const downloadURL = (url, filename) => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', `${url}?tempId=${Math.random()}`)
  xhr.responseType = 'blob'
  xhr.onload = () => {
    downloadBlob(xhr.response, filename)
  }
  xhr.send(null)
}

const downloadBlob = (blob, filename) => {
  if (window.navigator && window.navigator.msSaveOrOpenBlob) { // for IE
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  let downloadLink = document.createElement('a')
  let downloadURL = URL.createObjectURL(blob)

  downloadLink.href = downloadURL
  downloadLink.download = filename
  downloadLink.click()

  setTimeout(() => {
    downloadLink = null
    URL.revokeObjectURL(downloadURL)
    downloadURL = null
  }, 1000)
}

const useURLloader = (type, data, urlParameter, params = {}) => {
  const [response, setRes] = useState()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    createRequest(type, data, urlParameter, params)
      .then(res => {
        setRes(res)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [type, data, urlParameter, params])

  return [response, loading]
}

const parseBlobText = response =>
  new Promise((resolve, reject) => {
    try {
      if (!response) {
        reject({
          code: '500',
          message: '网络错误',
        })
      } else if (response.text) {
        response.text().then(text => {
          resolve(JSON.parse(text))
        })
      } else {
        const fileReader = new FileReader()
        fileReader.onloadend = event => {
          resolve(JSON.parse(event.srcElement.result))
        }
        fileReader.readAsText(response)
      }
    } catch (error) {
      reject(error)
    }
  })

const downloadResponseParser = xhr => {
  const disposition = xhr.getResponseHeader('Content-Disposition')
  const filename = disposition
    ? disposition.slice(disposition.toLowerCase().indexOf('filename=') + 9).replace(/"|'/g, '')
    : `文件_${new Date().getTime()}`

  if (xhr.response.type && xhr.response.type.toLowerCase && xhr.response.type.toLowerCase().includes('application/json')) {
    return parseBlobText(xhr.response).catch(error => {
      return {
        code: 500,
        message: '导出失败',
      }
    })
  }

  return {
    code: 200,
    data: {
      blob: xhr.response,
      filename: filename,
    },
  }
}

const defaultResponseHandler = data => data

// 默认的响应数据解析器
const defaultResponseParser = (xhr, param) => {
  let responseData = null

  try {
    responseData = JSON.parse(xhr.responseText)
  } catch {
    return {
      code: -1,
      message: '无法解析接口返回结果',
    }
  }

  if (responseData === null) {
    return {
      code: -1,
      message: '无法解析接口返回结果',
    }
  }

  const code = Number(responseData.code)

  if (code === 200) {
    return responseData
  }

  responseData = responseData || {
    code: -2,
    message: '接口返回数据无效',
  }

  return responseData
}

const request = param => {
  let {
    url,
    data,
    headers,
    timeout,
    isFormData,
    ignoreEmptyParams,
    trimStringFields,
    ingoreCodeError,
    method,
    responseType,
    responseParser,
    responseHandler,
    useCache,
    urlPrefix = '',
    cacheTimeout = 500,
  } = param

  data = data || {}
  // 相对路径自动加/api/前缀
  !/^https?:\/\//.test(url) && (url = `${urlPrefix}${url}`)

  if (useCache && requestCache[url] && Date.now() - requestCache[url].createTime < cacheTimeout) {
    return requestCache[url].promise
  }

  const requestPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // 参数和默认参数处理
    method = method || request.defaultParams.method
    method = method.toUpperCase()
    timeout = timeout || request.defaultParams.timeout
    responseType = responseType || request.defaultParams.responseType
    responseParser = responseParser || request.defaultParams.responseParser
    responseHandler = responseHandler || request.defaultParams.responseHandler
    headers = { ...request.defaultParams.headers, ...headers }

    if (method === 'POST' && (data instanceof FormData || isFormData)) {
      isFormData = true
      Object.keys(request.defaultParams.data).forEach(key => {
        data.append(key, request.defaultParams[key])
      })
      /**
       * **formData类型的请求，由xhr自行控制Content-Type，为此需要删除headers中指定的Content-Type**
       */
      delete headers['Content-Type']
      headers['Accept'] = 'application/json'
    } else {
      // FIXME: 当data 为数组时，会被转化成object ，不适宜
      // data = { ...request.defaultParams.data, ...data }
    }

    // get请求需要重新处理data和url
    if (method === 'GET') {
      if (Object.keys(data).length > 0) {
        url = `${url}?${route.objectToQueryString(data)}`
      }
      data = null
    }

    // 开启请求连接
    xhr.open(method, url, true)
    xhr.responseType = responseType
    xhr.timeout = timeout

    // 设置请求头
    Object.keys(headers).forEach(name => {
      xhr.setRequestHeader(name, headers[name])
    })

    // 监听请求状态变更
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          try {
            let response = responseParser(xhr, param)
            if (response && response.then) {
              response
                .then(nestedResponse => {
                  if (`${nestedResponse.code}` === '200') {
                    resolve(responseHandler(nestedResponse, param, xhr))
                  } else {
                    ingoreCodeError ? resolve(responseHandler(nestedResponse, param, xhr)) : reject(responseHandler(nestedResponse, param, xhr))
                  }
                })
                .catch(error => {
                  reject(responseHandler(error, param, xhr))
                })
            } else if (`${response.code}` === '200') {
              resolve(responseHandler(response, param, xhr))
            } else {
              ingoreCodeError ? resolve(responseHandler(response, param, xhr)) : reject(responseHandler(response, param, xhr))
            }
          } catch (error) {
            reject(responseHandler(error, param, xhr))
          }
        } else {
          reject(
            responseHandler(
              {
                code: xhr.status,
                message: '接口请求失败',
              },
              param,
              xhr
            )
          )
        }
      }
    }

    // 监听接口请求超时
    xhr.ontimeout = () => {
      reject(
        responseHandler(
          {
            code: 408,
            message: '接口请求超时',
          },
          param,
          xhr
        )
      )
    }

    data &&
      Object.keys(data).forEach(key => {
        if (ignoreEmptyParams && validate.isEmptyValue(data[key])) {
          delete data[key]
        } else {
          if (typeof data[key] === 'string' && trimStringFields) {
            data[key] = data[key].trim()
          }
        }
      })

    // 发送请求
    xhr.send(isFormData ? data : JSON.stringify(data))
  })
    .then(data => {
      return data
    })
    .catch(data => {
      throw data
    })

  if (useCache) {
    requestCache[url] = {
      createTime: Date.now(),
      promise: requestPromise,
    }

    base.delay(cacheTimeout).then(() => {
      delete requestCache[url]
    })
  }

  return base.makeCancelablePromise(requestPromise)
}

request.defaultParams = {
  urlPrefix: '',
  method: 'GET',
  timeout: 30000,
  data: {},
  isFormData: false,
  ingoreCodeError: false, // 是否忽略code不为200的情况，而将所有status为200的响应视为成功
  noErrorToast: false, // 是否隐藏信息toast提示
  ignoreEmptyParams: false,
  trimStringFields: false,
  useCache: false,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  responseType: '',
  responseHandler: defaultResponseHandler,
  responseParser: defaultResponseParser,
}

request.setDefaultParams = (params = {}) => {
  request.defaultParams = {
    ...request.defaultParams,
    ...params,
  }
}

request.get = (url, data, params) => request({ url, data, method: 'GET', ...params })
request.post = (url, data, params) => request({ url, data, method: 'POST', ...params })
request.download = (url, data, params = {}) => {
  let requestParams = {
    method: 'POST',
  }

  if (typeof params === 'string') {
    requestParams.method = params.toUpperCase()
  } else {
    requestParams = {
      ...requestParams,
      ...params,
    }
  }

  return new Promise((resolve, reject) => {
    return request({
      url,
      data,
      responseType: 'blob',
      ...requestParams,
      responseParser: downloadResponseParser,
    })
      .then(responseData => {
        downloadBlob(responseData.data.blob, requestParams.fileName || decodeURIComponent(responseData.data.filename))
        resolve(responseData)
      })
      .catch(reject)
  })
}

export { downloadURL, downloadBlob, useURLloader }
export default request
