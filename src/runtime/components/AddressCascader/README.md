##### 省市区 UI 组件

### 示例代码

```
 [
    {
      value: '1',
      label: '北京市',
      children: [
        { value: '1-1', label: '朝阳区' },
        { value: '1-2', label: '玄武区' },
      ],
    },
    {
      value: '2',
      label: '天津市',
    },
    {
      value: '3',
      label: '安徽省',
      children: [
        {
          value: '3-1',
          label: '芜湖市',
          children: [{ value: '3-1-1', label: '鸠江区' },{ value: '3-1-2', label: '镜湖区' }],
        },
        { value: '3-2', label: '淮南市' },
      ],
    },
  ]

<Form.Item>
      {getFieldDecorator('address', {
        initialValue: [
          {
            value: '3',
            label: '安徽省',
          },
          {
            value: '3-1',
            label: '芜湖市',
          },
          { value: '3-1-1', label: '镜湖区' },
        ],
      })(<AddressCascader options={this.state.list} loading={this.state.loading} />)}
</Form.Item>
```

### 参数说明

| 参数              | 说明                                                                                                                  | 类型     | 默认值   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| options           | 数据源                                                                                                                | Option[] | ---      |
| loading           | 加载中状态                                                                                                            | Boolean  | false    |
| 表单 initialValue | 回填值                                                                                                                | Obejct[] | ---      |
| valueKey          | id 字段名称                                                                                                           | String   | value    |
| labelKey          | 显示字段名称                                                                                                          | String   | label    |
| childrenKey       | 子级字段名称                                                                                                          | String   | children |
| onChange          | 表单传值 Object[]: [{value: "3", label: "安徽省"},{value: "3-1", label: "芜湖市"}, {value: "3-1-2", label: "镜湖区"}] | Object[] | ---      |

### Option

```
interface Option {
  value: string | number;
  label: React.ReactNode;
  children: Option[];
}
```
