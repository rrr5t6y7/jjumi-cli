import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd'; // 布局容器 导航菜单
import _ from 'lodash'; // 引入JS工具库
import { Link } from 'umi'; // umi自带的链接组件
import Breadcrumbs from '@/Breadcrumbs.js';
import Index from '@/pages/index';
import Login from '@/pages/login';
import { menus } from '../../config.router'; // 配置的菜单项
import styles from '../assets/index.scss';
import logo from '../assets/images/logo.png';

const { SubMenu } = Menu; // 子菜单
const { Header, Content, Sider } = Layout; // 顶部布局， 内容部分， 侧边栏

export default function LayoutDom(props: any) {
  const [isLogin, updateLogin] = useState(false);
  const [isIndex, updateIndex] = useState(false);

  useEffect(() => {
    const { location } = props;
    const { pathname } = location;
    if (pathname === '/admin/login') {
      updateLogin(true);
    } else if (pathname === '/admin') {
      updateIndex(true);
    }
  }, []);
  function getMenuItem(menuArr: any) {
    // 获取菜单项
    return _.map(menuArr, (route) => {
      console.log(route);
      if (route.children) {
        // 有多级菜单时
        return (
          <SubMenu key={route.key} title={route.title}>
            {getMenuItem(route.children)}
          </SubMenu>
        );
      }
      return (
        <Menu.Item key={route.key}>
          <Link to={route.path}>{route.title}</Link>
        </Menu.Item>
      );
    });
  }

  function sideBarRender() {
    return (
      <Sider width={180} style={{ height: 'calc(100vh-48px)' }}>
        <Menu
          mode="inline"
          theme="dark"
          style={{ height: '100%', borderRight: 0 }}
        >
          {getMenuItem(menus)}
        </Menu>
      </Sider>
    );
  }

  console.log(isLogin);
  console.log(props.children);
  return isLogin ? (
    <Login />
  ) : (
    <Layout>
      <Header className={`height-48 ${styles.headerBox}`}>
        <img src={logo} />
      </Header>
      <Layout>
        {sideBarRender()}
        <Layout>
          <Content>
            <div id="allContentBox" style={{ height: 'cacl(100vh-48px)' }}>
              {isIndex ? (
                <Index />
              ) : (
                <>
                  <Breadcrumbs />
                  <div className="innderContentBox">{props.children}</div>
                </>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
