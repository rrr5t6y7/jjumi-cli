## 通用列表页基类
用于快速搭建一个包含搜索栏和数据列表的页面

#### 说明
该基类实际上是将一个标准的**搜索栏** + **数据表格**的页面的主要逻辑进行了封装，包括搜索参数、分页的处理，减少大量重复代码的编写，
同时也可以通过重写父类的方法来实现个性化的需求。

**强烈建议看一遍TableBasePage组件源码以解锁更详细的用法**

#### 使用方法
```jsx
import TableBasePage from 'components/TableBasePage'
import fetchUserData from 'services/xxx.js'

class UsersPage extends TableBasePage {

  // 设置搜索项
  // 关于搜索项更相信的配置，可以参见： http://code.lingzhi.com/fed/npm/react-components/tree/master/src/components/SearchBar
  getSearchFields = ({ searchParams }) => {

    return [
      {
        name: 'username',
        label: '用户名',
        type: 'input',
        initialValue: searchParams.templateName,
        props: {
          placeholder: '请填写用户名',
        },
      }
    ]

  }

  // 设置Tab筛选的字段值(可选的)
  tabFilterFieldName = 'userType'

  // 设置Tab筛选项(可选的)
  getTabFilterItems = () => [
    {
      value: '',
      label: '全部',
    },
    {
      value: '1',
      label: '前端',
    },
    {
      value: '2',
      label: '后端',
    },
    {
      value: '3',
      label: '测试',
    },
    {
      value: '4',
      label: '设计',
    },
    {
      value: '5',
      label: '产品',
    },
    {
      value: '6',
      label: '运维',
    }
  ]

  // 设置表格数据列
  getTableColumns = () => {
    return [
      {
        title: '编号',
        dataIndex: 'number',
      },
      {
        title: '姓名',
        dataIndex: 'username',
      },
      {
        title: '手机号',
        dataIndex: 'phone',
      },
      {
        title: '操作',
        render: (item) => <a href={`/user/detail?id=${item.id}`}>查看</a>
      }
    ]
  }

  // 设置异步数据加载函数
  tableDataLoader = async (searchParams) => {
    const { code, data: tableData } = await fetchUserData(searchParams)
    if (code === 200) {
      return tableData
      // 请保证该函数返回的数据类型是：{ list: any[], total: number }
    }
  }


  // 渲染页面
  render () {

    return (
      <div className="page-users page-standard">
        <div className="searchbar-wrapper">{this.renderSearchBar()}</div>
        <div className="tab-wrapper">{this.renderTabFilter()}</div>
        <div className="table-wrapper">{this.renderDataTable()}</div>
      </div>
    )

  }

}
```

