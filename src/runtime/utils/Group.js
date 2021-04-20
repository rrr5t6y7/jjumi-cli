/*
 * @Author: yao guan shou
 * @Date: 2021-03-26 13:45:47
 * @LastEditTime: 2021-03-26 14:27:29
 * @LastEditors: Please set LastEditors
 * @Description:js 全排列组合算法，处理后台交叉集数据不给全问题。
 * @FilePath: /tossjs/runtime/utils/Group.js
 */

export default class Group {
  constructor(data) {
    this.allData = data
  }
  init() {
    this.getSingleNameData()
    return this.dataSort(this.addGroup(this.allData, this.singleNameData))
  }
  getSingleNameData() {
    this.singleNameData = this.allData.filter(item => {
      return item.customName.length == 1
    })
  }

  dataSort(data) {
    return data.sort((a, b) => {
      return a.customName.length - b.customName.length
    })
  }

  // 增加组合排序
  addGroup(allData, singleNameData = [], index = 0, group = []) {
    //创建新的数组
    var needApply = new Array()
    let newCustomName = []
    let flag = true
    if (!singleNameData.length) {
      return []
    }
    // 添加一个数据
    needApply.push(singleNameData[index])
    for (var i = 0; i < group.length; i++) {
      flag = true
      newCustomName = [...group[i].customName]
      newCustomName.push(...singleNameData[index].customName)
      newCustomName = newCustomName
        .sort((a, b) => {
          return a - b
        })
        .join('&')
      for (let item of allData) {
        let customName = item.customName
          .sort((a, b) => {
            return a - b
          })
          .join('&')
        if (newCustomName == customName) {
          flag = false
          needApply.push(item)
        }
      }
      if (flag) {
        //添加缺少数据
        needApply.push({
          id: '',
          code: '',
          name: newCustomName,
          value: '0',
          dimensionName: allData[0]?.dimensionName,
          customName: newCustomName.split('&'),
          percent: 0,
          // color: "rgb(221, 158, 92)",
          unit: allData[0]?.unit,
        })
      }
    }
    group.push.apply(group, needApply)
    if (index + 1 >= singleNameData.length) {
      // 返回
      return group
    } else {
      return this.addGroup(allData, singleNameData, index + 1, group)
    }
  }
}
