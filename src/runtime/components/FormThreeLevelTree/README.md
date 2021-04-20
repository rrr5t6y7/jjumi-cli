## FormThreeLevelCascader组件参数

## 入参说明：

| 参数             | 说明                                                         |
| :--------------- | :----------------------------------------------------------- |
| serviceName      | ajax 请求地址 ，参数可选                                     |
| requestParams    | 控制弹窗显示或者影藏，布尔值 true 则显示，false 则隐藏       |
| dataMapper       | 组                                                           |
| onReady          | 底部按钮参数 具体请看 antd 官网参数                          |
| treeData         | 如果是单个则是字字符串，如果是使用 tabs 则参数是数组         |
| filterLevelOne   | 用于过滤第一级tree 数据 ，参数可选， 一般没啥用              |
| filterLevelTwo   | 用于过滤第二级tree 数据 ，参数可选， 一般没啥用              |
| filterLevelThree | 用于过滤第三级tree 数据 ，参数可选， 一般没啥用              |
| showLevelOne     | 是否显示一级Select 下拉框，默认 true                         |
| showLevelTwo     | 是否显示二级Select 下拉框，默认 true                         |
| showLevelThree   | 是否显示三级Select 下拉框 默认 true                          |
|                  |                                                              |
|                  |                                                              |
|                  |                                                              |
|                  |                                                              |
|                  |                                                              |
|                  |                                                              |
| onChange         | 改变值的时候回调函数                                         |
| searchProps      | 数组对象设置 一级为第一个数组对象,以此类推， [{  isShow:true }  ] ,  isShow 是添加字段是否显示搜索，其他更多参考 antd search文档 |
| selectProps      | 数组对象设置 一级为第一个数组对象,以此类推， [{  placeholder: selectPlaceholder = '全部', onChange: selectOnChangeOpen = () => {}}  ] , 一个是设置placeholder，和打开弹窗触发事件 |
| treeProps        | 数组对象设置 一级为第一个数组对象,以此类推， [{  displaySelectedText = '显示已选', hideAllText = '显示全部', isShowSelectedBut = true, }  ] , displaySelectedText显示已选文字展示  ，hideAllText显示全部 文字显示  isShowSelectedBut 是否显示切换已选   其他更多参考  antd tree文档 |
| nextLevelKey     | 为下一级的树形 key，一般为children，具体看自己树形结构  必要参数 |
| valueKey         | 作为tree树形数据中的唯一key，比如id字段等 必要参数           |
| labelKey         | 作为需要在Option 展示的key 一般为name字段 必要参数           |
| mapKye           | 映射key，具体看demo  必要参数                                |

## onChange 出参说明：

| 参数                               | 说明                          |
| :--------------------------------- | :---------------------------- |
| allList                            | tree树下的所有数据 点平过数据 |
| selectdData                        | tree树下选中的数据 点平过数据 |
| treeData                           | 原始的树形数据                |
| 其他字段是根据自己的mapKye映射出来 |                               |
| levelOneCheckedData                | 一级form表单选中数据          |
| levelOneCheckedKeys                | 一级form表单选中数据key       |
| levelTwoCheckedData                | 二级级form表单选中数据        |
| levelTwoCheckedKeys                | 二级form表单选中数据key       |
| levelThreeCheckedData              | 三级级form表单选中数据        |
| levelThreeCheckedKeys              | 三级form表单选中数据key       |



 



## demo

```

// 假设 远程给的 数据 是这样
const treeData=[
               {     
                    // 超市类s
                    categoryCode: '00',  //valueKey
                    categoryName: '超市',
                    category: '00|超市',  //labelKey
                    parentCategory: null,
                    nextCategoryRes:[ //nextLevelKey
                                      // 种类
                                      {
                                         categoryCode: '8802', //valueKey
                                         categoryName: '生鲜食品类',
                                         category: '8802|生鲜食品类',  //labelKey
                                         parentCategory: '00',
                                         nextCategoryRes: [ //nextLevelKey
                                                             // 小类
                                                             {
                                                                 categoryCode: '880201',
                                                                 categoryName: '畜肉类',
                                                                 category: '880201|畜肉类',
                                                                 parentCategory: '8802',
                                                                 nextCategoryRes: null,
                                                                 hierarchy: '3',
                                                             },
                                                      ]
                                        }   
                                  ]
                }
           ]     
  
  
  
  mapKye 映射的字段
  //   mapKye={[
                {
                 // 数据原始字段      映射出来新字段
                  categoryCode: 'supermarketCode', // 超市
                  category: 'supermarket',
                  categoryName: 'supermarketName',
                  parentCategory: 'supermarketParent',
                },
                {
                  categoryCode: 'middleCode', // 中类
                  category: 'middle',
                  categoryName: 'middleName',
                  parentCategory: 'middleParent',
                },
                {
                  categoryCode: 'smallCode', // 小类
                  category: 'small',
                  categoryName: 'smalleName',
                  parentCategory: 'smalleParent',
                },
              ]}
  
  
  
  
   // 组件code
  {
          name: 'classification',
          label: '可用门店',
          type: 'cascader',
          span: 2,
          labelSize: 'short',
          component: (
           <FormThreeLevelTree
            serviceName={'marketing.productActivities.getCategoryClassifyList'}
            selectProps={[
              {
                placeholder:'全部R3分类'
              },
              {
                // isShow:true,
               },
               {
                isShow:true,
              }
            ]}
            treeProps={[
              {
                  isShowSelectedBut:false,
                  displaySelectedText:'显示选中的',
                // hideSelectedText:true,
                // onCheck:()=>{}
              },
              {
                // displaySelectedText:'显示选中的',
                // isShow:true,
               },
               {
                // displaySelectedText:'显示选中的',
                  // isShow:true,
              }
            ]}
            searchProps={[
              {
                isShow:false,
              },
              {
                isShow:true,
               },
               {
                  isShow:true,
              }
            ]}
            requestParams={{}}
            nextLevelKey={'nextCategoryRes'}
            labelKey={'categoryName'}
            valueKey={'categoryCode'}
            dataMapper={(data) => dataMapperR3Select(data)}
            onChange={(data)=>{
              console.log('data=============',data)

            }}
            mapKye={[
              {
                categoryCode: 'supermarketCode', // 超市
                category: 'supermarket',
                categoryName: 'supermarketName',
                parentCategory: 'supermarketParent',
              
              },
              {
                categoryCode: 'middleCode', // 中类
                category: 'middle',
                categoryName: 'middleName',
                parentCategory: 'middleParent',
              
              },
              {
                categoryCode: 'smallCode', // 小类
                category: 'small',
                categoryName: 'smallName',
                parentCategory: 'smallParent',
            
              },
            ]}
          />
          ),
          
        },
```

## 更改 searchParams 参数

- 比如字段 storeCodes 但是后台搜索参数需要的字段是

- 事业：businessCode，

- 区域：regionCode，

- 门店：storeCode

```
  searchParamsExtractor = {
    classification: (data) => {
      return {
          // .... 其他字段映射 省略
          selectdList: data.selectdList, // list
      }
    },

  }
```



##
