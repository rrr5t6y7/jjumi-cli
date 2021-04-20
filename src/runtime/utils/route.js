/**
 * **路由功能基础函数**
 * @author 王刚(Margox Wang)
 * @date 2019-05-08
 */

import { validate } from 'toss.utils'

export const isPathMatch = (path, strict = false, prefix = '') => {
  return path && strict ? `${prefix}${path}` === location.pathname : location.pathname.indexOf(`${prefix}${path}`) === 0
}

export const getURLParams = search => {
  search = search || location.search

  const list = search.split('?')

  if (!validate.isEmptyArray(list) && list.length > 1) {
    const item = list[1]
    let items = item.split('&')

    if (validate.isEmptyArray(items)) {
      items = []
    }

    const newParams = {}

    items.map(rs => {
      const param = rs.split('=')

      if (!validate.isEmptyArray(param)) {
        let key = ''
        let value = ''

        if (param.length === 1) {
          key = param[0]
        } else if (param.length === 2) {
          key = param[0]
          value = param[1]
        }
        key && value && (newParams[key] = value)
      }
    })
    return newParams
  } else {
    return {}
  }
}

export const objectToQueryString = function (json, sort, encode) {
  var result = ''
  var data = json
  if (sort) {
    var sortedData = {}
    var sortedKeys = Object.keys(json).sort()
    sortedKeys.forEach(function (key) {
      sortedData[key] = json[key]
    })
    data = sortedData
  }
  for (var item in data) {
    if (typeof data[item] !== 'undefined') {
      if (encode) {
        result += '&' + item + '=' + encodeURIComponent(data[item])
      } else {
        result += '&' + item + '=' + data[item]
      }
    }
  }
  return result
}

export const mergeURLParams = function (url, params) {
  if (typeof url !== 'string') {
    return null
  }

  const [baseUrl, search] = url.split('?')
  const originURLParams = getURLParams(`?${search}`)

  return `${baseUrl}?${objectToQueryString({ ...originURLParams, ...params })}`
}

export default { isPathMatch, getURLParams, objectToQueryString, mergeURLParams }
