# Picker组件包
这个组件包里面包含了需要弹窗展示或内联展示的表格选择组件、树形选择组件，以及一个数据导入组件和弹窗组件通用容器

## PickerGroup
PickerGroup将表格选择器、树形选择器等组合到一起，可以随意切换展示，下面是示例代码：
```js
import PickerGroup, { EmbedPickerGroup } from 'components/PickerGroup'

// 通过一个sections数组来定义需要在PickerGroup中展示的选择器集合
const sections = [
  // 定义一个商品选择器
  {
    key: 'product', // 选择器的key，不能重复
    type: 'table', // 目前支持table和tree两种
    title: '商品', // 选择器的显示名称
    importable: true, // 是否显示导入tab
    selectable: true, // 是否可选择
    rowKey: 'productCode', // 表格的rowKey
    serviceName: 'common.getProducts', // 表格数据的加载服务名
    searchBarProps: { // 指定搜索栏树形，可参考TableBasePage和SearchBar组件
      tailSpan: 2,
      tailAlign: 'right',
    },
    searchFields: [ // 表格的搜索项定义，可参考TableBasePage
      {
        type: 'input',
        name: 'productName',
        label: '商品名称',
        labelSize: 'small',
      },
      // ...
    ],
    columns: [ // 表格的列，可参考TableBasePage
      {
        title: '商品名称',
        dataIndex: 'productName',
      },
      // ...
    ]
  },
  // 定义一个品牌选择器
  {
    key: 'brand',
    type: 'table',
    title: '品牌',
    importable: false, // 隐藏导入功能
    selectable: true,
    rowKey: 'brandCode',
    serviceName: 'common.getBrands',
    searchBarProps: {
      tailSpan: 2,
      tailAlign: 'right',
    },
    searchFields: [
      {
        type: 'input',
        name: 'brandCode',
        label: '品牌编码',
        labelSize: 'small',
      },
      // ...
    ],
    columns: [
      {
        title: '品牌名称',
        dataIndex: 'brandName',
      },
      // ...
    ]
  },
  // 定义一个分类选择器
  {
    key: 'category',
    type: 'tree', // 树形选择器
    title: '分类',
    serviceName: 'common.getCategory',
  }
]

// 以按钮+弹窗形式渲染组件
<PickerGroup title="选择适用范围" sections={sections} />

// 也可直接将组件渲染在页面上
<EmbedPickerGroup title="选择适用范围" sections={sections} />
```

### PickerGroup组件是一个受控组件，传入value和onChange可正常工作，可以直接结合Antd Form使用

```js
// 结合上面的示例，value的结构如下
const value = {
  product: [
    {
      productCode: '1',
      // ...
    },
    {
      productCode: '2',
      // ...
    },
    // ...
  ],
  brand: [
    {
      brandCode: '1',
      // ...
    },
    {
      brandCode: '2',
      // ...
    },
    // ...
  ],
  category: [
    {
      brandCode: '1',
      // ...
    },
    {
      brandCode: '2',
      // ...
    },
    // ...
  ]
}
```

### PickerGroupProps
| Name             | Type                       | Description      |
| :--------------- | :------------------------- | :--------------- |
| value            | `{[SectionItem.key]: any}` | value属性        |
| defaultValue     | `{[SectionItem.key]: any}` |                  |
| readOnly(开发中) | `boolean`                  | 是否只读         |
| sections         | `SectionItem[]`            | 子选择器配置项目 |
| className        | `string`                   | 额外样式名       |
| confirmText      | `string`\|`JSX.Element`    | 确定按钮文字     |
| cancelText       | `string`\|`JSX.Element`    | 取消按钮文字     |
| selectedLabel    | `string`\|`JSX.Element`    | `已选`文字       |

除此之外，还继承了下面的弹窗相关的组件属性（`EmbedGroupPicker`不支持下面的属性）
| Name            | Type                | Description                                  |
| :-------------- | :------------------ | :------------------------------------------- |
| hideEntryButton | `boolean`           | 是否隐藏弹窗触发按钮                         |
| buttonText      |                     | 弹窗触发按钮文案                             |
| buttonProps     | `Antd Button Props` | 弹窗按钮属性                                 |
| modalWidth      | `number`            | 弹窗宽度                                     |
| modalVisible    | `boolean`           | 弹窗是否显示，用于需要外部控制弹窗显示的场景 |
| modalProps      | `Antd Modal Props`  | 弹窗Modal属性                                |

**SectionItem**
| Name   | Type                           | Description                    |
| :----- | :----------------------------- | :----------------------------- |
| key    | `string`                       | 子选择器的key，不能重复        |
| type   | `table`\|`tree`                | 子选择器类型，目前支持表格和树 |
| title  | `string`\|`JSX.Element`        | 子选择器标题                   |
| render | `(SectionItem) => JSX.Element` | 自定义渲染子选择器             |

> `SectionItem`中的其他属性会直接解构展开到具体的子选择器组件上，请参考下面各子组件的具体属性


## TablePicker
列表选择器组件，内部继承TableBasePage实现，完善了列选择功能，增加了导入功能
