/*
 * @Author: superhu
 * @Date: 2020-06-09 16:39:33
 * @Last Modified by: superhu
 * @Last Modified time: 2020-07-21 14:26:38
 */

export const province = { label: '省份', value: 'province' }
const city = { label: '城市', value: 'city' }
const area = { label: '县区', value: 'area' }

/**
 * 点击tab处理 返回新的tab数据
 */
export const tabFilter = (tab) => {
  const tabArray = []
  switch (tab) {
    case 'province':
      tabArray.push(province)
      break
    case 'city':
      tabArray.push(province, city)
      break
    case 'area':
      tabArray.push(province, city, area)
      break
    default:
  }
  return tabArray
}

export const switchTab = (tab) => {
  let tabValue
  switch (tab) {
    case 'province':
      tabValue = 'city'
      break
    case 'city':
      tabValue = 'area'
      break
    default:
  }
  return tabValue
}

export const clearSelectedOptions = (selectedOptions, activityTab) => {
  switch (activityTab) {
    case 'province':
      delete selectedOptions.city
      delete selectedOptions.area
      break
    case 'city':
      delete selectedOptions.area
      break
    default:
  }
  return selectedOptions
}

/**
 * onchang 处理数据
 */
export const outChangeData = (selectedOptions, activityTab, valueKey, labelKey) => {
  let list = []
  let listId = []
  for (let key in selectedOptions) {
    const item = selectedOptions[key]
    list.push(item)
    listId.push(item[valueKey])
    if (activityTab === key) {
      break
    }
  }
  return { list, listId }
}

// selectedOptions
export const getCurrentSelect = (values = [], options, valueKey, childrenKey) => {
  let list = [...options]

  const result = {}
  const tabArray = []
  tabArray.push(province)

  const selectedOptions = {}

  result.province = options
  result.activityTab = 'province'

  values.forEach((element, index) => {
    const newList = list.filter((item) => `${item[valueKey]}` === `${element[valueKey]}`)
    console.log('newList', newList)
    if (newList && newList.length > 0 && newList[0][childrenKey]) {
      list = newList[0][childrenKey]

      if (index === 0) {
        // 省份
        selectedOptions.province = newList[0]
        result.city = newList[0][childrenKey]
      } else if (index === 1) {
        // 城市
        tabArray.push(city)
        result.activityTab = 'city'
        selectedOptions.city = newList[0]
        result.area = newList[0][childrenKey]
      } else if (index === 2) {
        // 区域
        tabArray.push(area)
        result.activityTab = 'area'
        selectedOptions.area = newList[0]
      }
      result.selectId = element[valueKey]
    }
  })
  result.selectedOptions = selectedOptions
  result.tabItems = tabArray
  // console.log('result', result)
  return result
}
