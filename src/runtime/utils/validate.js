/**
 * 判断空数组
 * @param {Array} array 需要判断的数组
 * @returns {boolean}
 */

export const isEmptyArray = (array) => {
  return !Array.isArray(array) || array.length === 0
}

/**
 * 判断空对象
 * @param {Object} object 需要判断的对象
 * @returns {boolean}
 */
export const isEmptyObject = (object) => {
  let empty = false
  if (!(object instanceof Object)) {
    object = {}
  }
  empty = Object.keys(object).length === 0
  return empty
}

export const isEmptyValue = (value) => {
  return value == null || value === ''
}

/**
 * 判断一个函数是否是一个生成器函数
 * @param {Function} fn
 * @returns {Boolean}
 */
export const isGeneratorFunction = (fn) => {
  return fn && Object.prototype.toString.call(fn) === '[object GeneratorFunction]'
}

export const isNotNumber = (value) => {
  return isEmptyValue(value) || isNaN(value)
}

export const noopValidator = (rule, value, callback) => callback()

export const patterns = {
  integer: /^[1-9]\d*$/,
  nonNegativeInteger: /^(0|[1-9]\d*)$/,
  limitedInteger: /^[1-9]\d{0,7}$/,
  cashTwo: /^(([1-9]{1}\d*)|(0{1}))(\.\d{2})?$/,
  cash: /^(([1-9]{1}\d*)|(0{1}))(\.\d{0,2})?$/,
  invalidCash: /\..{3}/,
}

export const validators = {
  isPatternMatch: (value, pattern) => {
    if (!value) {
      return true
    }
    return pattern && pattern.test && pattern.test(value)
  },
  isNumber: (number) => {
    return !isNotNumber(number)
  },
  isBetween: (number, min, max) => {
    return validators.isNumber(number) && number >= min && number <= max
  },
  isLessThan: (number, targetNumber) => {
    if (isNotNumber(number) || isNotNumber(targetNumber)) {
      return true
    }
    return +number < +targetNumber
  },
  isLessThanOrEqualTo: (number, targetNumber) => {
    if (isNotNumber(number) || isNotNumber(targetNumber)) {
      return true
    }
    return +number <= +targetNumber
  },
  isLargerThan: (number, targetNumber) => {
    if (isNotNumber(number) || isNotNumber(targetNumber)) {
      return true
    }
    return +number > +targetNumber
  },
  isLargerThanOrEqualTo: (number, targetNumber) => {
    if (isNotNumber(number) || isNotNumber(targetNumber)) {
      return true
    }
    return +number >= +targetNumber
  },
  isEmptyArray,
  isEmptyObject,
  isEmptyValue,
}

export default {
  isEmptyArray,
  isEmptyObject,
  isEmptyValue,
  isGeneratorFunction,
  isNotNumber,
  noopValidator,
  patterns,
  validators,
}
