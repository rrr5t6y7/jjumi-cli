# transformRoutePaths

- 收集路由的 name 作为 key，url 地址作为值，转义成一个对象 {name:url}

- 并且带有校验是否有重名 name 的路由

- 我们为什么要这样做，主要是为了结合 historyPush.js 一起使用

- 下面是使用 demo

- 比如在在项目的 utils 目录中建立 routePaths.js 使用 transformRoutePaths，该功能 js 是把 route 的 name 与 url 地址抽离出来。

  ```
  import {transformRoutePaths,getRoutePaths,historyPush} from 'toss.utils';
  //
  let marketingRoute = []
  let userRoute = []
  try {
    marketingRoute = {
      ...require('../pages/marketing/route'), // 功能模块中的路由文件
      filePath: '/marketing/route', // 功能模块路由地址的文件夹，主要用来校验警告错误日志
    }
  } catch (e) {
    console.warn(e)
  }
  try {
    userRoute = {
      ...require('../pages/user/route'),
      filePath: '/user/route',
    }
  } catch (e) {
    console.warn(e)
  }


  // 导出转义好的 路由对象{name:url}
  export const routePaths = transformRoutePaths(getRoutePaths([marketingRoute, userRoute]))
  export {
    historyPush
  }
  ```

# historyPush 路由跳转

- historyPush 主要是为了解决两个问题，第一个是如果我们页面上路由跳转直接用 react 的 push 直接写地址跳转，那么可能会引发一个问题，假如某一天该页面需要移动目录或者修改文件夹的时候，那么我们需要修改 route 中的地址，还需要修改页面功能跳转的地址，页面功能跳转地址可能会很多。这样导致了后期代码维护起来更加麻烦。通过 transformRoutePaths 收集路由的 name 与 url，在使用 historyPush 用路由的 name 作为跳转，这样就可以解决刚才的问题。

- 路由跳转的时候不可以自己使用 react props 中的 push 跳转，因为在生产环境可能该系统目录结构和域名不同，为了防止这样问题，我们封装了一层拦截

- 参数传参收集与转义，我们在传参的时候 无需在手动拼接在 url 地址上面，比如我们传统的地址传参和 get 传参跳转，可以通过对象方式传参。historyPush 通过传参和当前的 url 解析和替换转义成 url 所需要的地址。

- 还有一个功能是，我们在 a 页面在地址栏上面的参数，如果需要跳转到 b 页面的时候，该参数如果不变我们可以不用传参。如果需要增加参数我们可以传需要添加的参数即可。historyPush 帮你累加参数在地址栏上面，如果跳到 b 页面不需要 a 页面的参数的时候。比如我到 c 页面不需要 a 页面上面地址栏的 id 的时候我可以这样做,

  把 id 设置为 undefined 这样他就会丢弃该参数

  ```
   params: { // 地址传参
              id: undefined,

            },
  ```

- 使用方法

  ```
  import { historyPush, routePaths } from 'toss.utils' // 引入路由配置文件和跳转文件

     // 页面上使用historyPush 跳转
     //跳转方式
      historyPush({
            isOpenWin: true,  // 是否打开新的页面
            url: routePaths.activityDataDirectChargingDetail, // 路由name
            query:{},  // get 地址传参
            params: { // 地址传参
              id: record[this.tableRowKey],
              name,
            },
          })

  ```
