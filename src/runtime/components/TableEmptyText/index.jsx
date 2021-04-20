import React from 'react'

const TableEmptyText = ({ text, initialText, dataLoaded }) => {
  return (
    <div className="lz-antd-table-empty-placeholder">
      <span>{dataLoaded ? text : initialText}</span>
    </div>
  )
}

TableEmptyText.defaultProps = {
  dataLoaded: true,
  text: '哎呀，暂无数据哦',
  initialText: '搜索即可查看数据哦',
}

export default TableEmptyText
