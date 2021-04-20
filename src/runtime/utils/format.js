import { isEmptyObject } from 'toss.utils/validate'

export const formatRequestData = (values, ignoreValue) => {
  /* eslint-disable */
  for (const key in values) {
    if (values[key] === '' || values[key] === null || values[key] === undefined) {
      delete values[key]
    }
    if (typeof values[key] === 'string' && values[key].trim() === '') {
      delete values[key]
    }

    if (ignoreValue !== undefined && values[key] === ignoreValue) {
      delete values[key]
    }

    if (typeof values[key] === 'string') {
      values[key] = values[key].trim()
    }
  }
  return values
}

export const formatPhoneDisplay = phone => (phone ? `${phone}`.replace(/(\d{3})\d*(\d{4})/, '$1****$2') : '')

// 手机号脱敏
export const phoneDesensiti = formatPhoneDisplay

export const resolveCDNURL = cdnURLString => {
  try {
    return cdnURLString.replace(/^http(s)?:\/\/[^/]+/, '')
  } catch {
    return cdnURLString
  }
}

/**
 * 剔除对象value前后空格
 * @param {Object} object 需要处理的对象
 * @returns {Object}
 */
export const trimObject = object => {
  const params = {}
  if (isEmptyObject(object) === false) {
    // 非空对象
    Object.entries(object).map(item => {
      const [key, value] = item
      let newValue = value
      if (Object.prototype.toString.call(value) === '[object String]') {
        newValue = value.trim()
      }
      Object.assign(params, { [key]: newValue })
    })
  }
  return params
}

export default { formatRequestData, formatPhoneDisplay, phoneDesensiti, trimObject }
