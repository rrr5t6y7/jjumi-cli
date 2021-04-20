import getHistory from 'toss.history'
/**
 * **路由跳转函数封装**
 * @author 姚观寿
 * @date 2020-08-14
 */

// 获取url地址
const getNewUrlArr = parameter => {
  let newUrlArr = []
  const { url, index, params, pathnameArr } = parameter
  let key = null
  let optional = -1
  if (url.indexOf(':') >= 0) {
    optional = url.indexOf('?')
    key = url.substr(1)
    key = optional >= 0 ? key.slice(0, -1) : key
    if (params && key in params && params.hasOwnProperty(key)) {
      //如果参数等于undefined 则会丢弃
      params[key] !== undefined && newUrlArr.push(`/${params[key]}`)
    } else {
      ;(optional == -1 || pathnameArr[index]) && newUrlArr.push(`/${pathnameArr[index]}`)
    }
  } else {
    newUrlArr.push(`/${url}`)
  }
  return newUrlArr
}

// 把url 字符串转换成对象
const querystringParse = search => {
  search = search.substr(1)
  let searchArr = search.split('&')
  let objParameter = {}
  searchArr.forEach(target => {
    let parameter = target.split('=')
    objParameter[parameter[0]] = parameter[1]
  })
  return objParameter
}

// 把对象转成url参数
const queryStringify = data => {
  const keys = Object.keys(data)
  let formStr = ''
  if (keys.length === 0) {
    return formStr
  }
  keys.forEach(key => {
    if (data[key] === undefined || data[key] === null) {
      return
    }
    formStr += `&${key}=${data[key]}`
  })
  return formStr.substr(1)
}

// 序列化query参数
const serialize = data => {
  const { location } = window
  const { pathname, search } = location
  let formStr = ''
  if (search.length == 0) {
    formStr = queryStringify(data)
    formStr = `${formStr ? '?' + formStr : ''}`
  } else {
    formStr = queryStringify({
      ...querystringParse(search),
      ...data,
    })
    formStr = `${formStr ? '?' + formStr : ''}`
  }
  // return  encodeURIComponent(formStr)
  return formStr
}

// 路由跳转
const historyPush = parameter => {
  const {
    props = {}, // 组件的props
    params = {}, //地址传参
    query = {}, //get 传参
    isOpenWin = false, // 是否重新打开新的窗口
    url = '/',
  } = parameter
  const { history = null } = props
  const { location } = window
  const { pathname, search } = location
  const pathnameArr = pathname.split('/')
  const urlArr = url.split('/')
  let newUrlArr = []
  const basename = window.__TOSS_GLOBAL__.publicPathPrefix
  for (let [index, elem] of urlArr.entries()) {
    if (pathnameArr[index] && pathnameArr[index].trim() !== '' && urlArr[index] && urlArr[index].trim() !== '') {
      newUrlArr = [
        ...newUrlArr,
        ...getNewUrlArr({
          url: urlArr[index],
          index,
          params,
          pathnameArr,
        }),
      ]
    } else if (elem && elem.trim() !== '') {
      newUrlArr = [
        ...newUrlArr,
        ...getNewUrlArr({
          url: elem,
          index,
          params,
          pathnameArr,
        }),
      ]
    }
  }

  if (isOpenWin) {
    window.open(`${basename}${newUrlArr.join('')}${serialize(query)}`)
  } else {
    ;(history ? history : getHistory()).push(`${newUrlArr.join('')}${serialize(query)}`)
  }
}
// 地址 // 替换
const removeRepeatLine = str => str.replace(/\/\//g, '/')
// 路由地址 转义 成对象 与检测 name 是否有重名
const getRoutePaths = (route, routePaths = {}, prefix = '', filePath = null) => {
  route.forEach(target => {
    if (target['path'] && target['name']) {
      if (target['name'] in routePaths && routePaths.hasOwnProperty(target['name'])) {
        throw (target['filePath'] || filePath) == routePaths[target['name']].filePath
          ? `在${routePaths[target['name']].filePath}路由文件中,路由name为:${target['name']}命名有相同，发生路由name冲突！`
          : `在${target['filePath'] || filePath}路由文件与${routePaths[target['name']].filePath}路由文件中,路由name为:${
              target['name']
            }命名有相同，发生路由name冲突！`
      }
      routePaths[target['name']] = {
        filePath: target.filePath || filePath,
        path: removeRepeatLine(prefix + '/' + target['path']),
      }
    }
    if (target.children && target.children.length >= 1) {
      routePaths = {
        ...routePaths,
        ...getRoutePaths(target.children, routePaths, prefix + '/' + target['path'], target.filePath || filePath),
      }
    }
  })
  return routePaths
}
// 路由地址 转义 成对象
const transformRoutePaths = routePaths => {
  let newRoutePaths = {}
  for (let key in routePaths) {
    if (routePaths.hasOwnProperty(key)) {
      newRoutePaths[key] = routePaths[key].path
    }
  }
  return newRoutePaths
}

const navigateTo = (url, data, options = {}) => {
  const { method = 'params' } = options
  delete options.method
  data = {
    [method]: data,
  }
  historyPush({
    url,
    ...data,
  })
}

const redirectTo = (url, data, options = {}) => {
  const { method = 'params', replace = true } = options
  delete options.method
  data = {
    [method]: data,
  }
  historyPush({
    url,
    ...data,
    replace,
  })
}
const openWindow = (url, data, options = {}) => {
  const { method = 'params', isOpenWin = true } = options
  delete options.method
  data = {
    [method]: data,
  }
  historyPush({
    url,
    ...data,
    isOpenWin,
  })
}

export { navigateTo, redirectTo, openWindow, transformRoutePaths, getRoutePaths, historyPush }
