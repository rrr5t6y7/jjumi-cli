import 'toss.assets/less/theme.less'
import 'toss.assets/scss/_base.scss'
import { hot } from 'react-hot-loader/root'
import React from 'react'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import { SearchBar } from '@lingzhi/react-components'
import store from 'toss.store'
import { createHistory } from 'toss.history'
import { Icon, Table, message } from 'antd'
import { TableEmptyText, LazySelect } from 'toss.components'
import { lang } from 'toss.utils/lang'
import { isIE } from 'toss.utils/base'

window.lang = lang
window.isIE = isIE()

// 初始化Ant Design相关功能
Table.defaultProps = Table.defaultProps || {}
Table.defaultProps.locale = {
  emptyText: <TableEmptyText />,
}

// Table组件展开图标调整
Table.defaultProps.expandIcon = ({ expanded, onExpand, record, ...props }) => {
  return record && record.children && record.children.length ? (
    <span>
      <Icon onClick={event => onExpand(record, event)} type={expanded ? 'caret-down' : 'caret-right'} />
      &ensp;
    </span>
  ) : (
    <span></span>
  )
}

// 为SearchBar扩展LazySelect组件
SearchBar.extendFieldType('lazy-select', {
  render: fieldData => {
    return <LazySelect {...fieldData.props} />
  },
})

message.config({
  top: 20,
  duration: 2,
  maxCount: 1,
})

const AppRouter = hot(({ history, routerOptions, children }) => {
  return (
    <Router history={history} {...routerOptions}>
      {children}
    </Router>
  )
})

const TossEntry = props => {
  const history = createHistory(props.historyType, {
    basename: props.basename,
    ...props.historyOptions,
  })

  return (
    <Provider store={store}>
      <AppRouter history={history} routerOptions={props.routerOptions}>
        {props.children}
      </AppRouter>
    </Provider>
  )
}

TossEntry.defaultProps = {
  routerOptions: {},
  historyOptions: {},
  historyType: 'browserHistory',
  basename: '/',
}

export default TossEntry
