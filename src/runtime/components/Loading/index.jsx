/**
 * 公用加载提示组件
 * @author 王刚(Margox Wang)
 * @date 2019-05-08
 */

import React from 'react'
import './styles.scss'

const LoadingComponent = ({ className = '', text = '加载中...', loading = true, children = null }) => (
  <>
    {loading ? (
      <div className={`component-loading ${className}`}>
        <div className="loader">
          <div className="rect rect-1" />
          <div className="rect rect-2" />
          <div className="rect rect-3" />
          <div className="rect rect-4" />
          <div className="rect rect-5" />
        </div>
        <span className="text">{text}</span>
      </div>
    ) : (
      <>
        {React.Children.map(children, child => {
          return <>{child}</>
        })}
      </>
    )}
  </>
)

export default React.memo(LoadingComponent)
