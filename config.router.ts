// import IndexPage from './src/pages/index/index';

const frames: any = [];
// const context = require.context('./assets/images', false, /frame_\d+.png/);
// context.keys().forEach((k) => {
//   frames.push(context(k));
// });

console.log(frames);

// const routersList: any = [];
// function importAll(r: any) {
//   r.keys().forEach((key: any) => routersList.push(r(key).default) || r(key));
// }
// const getAllRouter = require.context('./src/models', false, /\.js$/);

// importAll(getAllRouter);
// console.log(routersList);

const basePath = '/admin';

export default [
  {
    exact: true,
    path: '/',
    redirect: basePath,
  },
  {
    path: basePath,
    component: '@/layouts/index',
    routes: [
      {
        exact: true,
        path: `${basePath}/login`,
        component: '@/pages/login',
      },
      {
        exact: true,
        path: `${basePath}/user_manage`,
        component: '@/pages/usermanage',
        name: '用户管理',
      },
      {
        exact: true,
        path: `${basePath}/good_manage`,
        component: '@/pages/goodmanage',
        name: '商品管理',
      },
      {
        exact: true,
        path: `${basePath}/good_manage/good_number`,
        component: '@/pages/goodmanage/goodnumber',
        name: '商品数量',
      },
      {
        exact: true,
        path: `${basePath}/good_manage/good_quality`,
        component: '@/pages/goodmanage/goodquality/index.jsx',
        name: '商品质量',
      },
      { path: '*', component: '@/pages/exception' },
    ],
  },
  { path: '*', redirect: `${basePath}/exception` },
];

export const menus = [
  // 菜单的配置项，用于动态渲染 key:	唯一标志 title: 菜单项值 path：用于路由跳转
  {
    key: 'good_manage',
    title: '商品管理',
    children: [
      {
        key: 'good_number',
        title: '商品数量',
        path: `${basePath}/good_manage/good_number`,
      },
      {
        key: 'good_quality',
        title: '商品质量',
        path: `${basePath}/good_manage/good_quality`,
      },
    ],
  },
  {
    key: 'address_manage',
    title: '地址管理',
    children: [
      { key: 'my_address', title: '我的地址', path: `${basePath}/my_address` },
    ],
  },
  {
    key: 'collect_manage',
    title: '收藏管理',
    path: `${basePath}/collect_manage`,
  },
  {
    key: 'user_manage',
    title: '用户管理',
    path: `${basePath}/user_manage`,
  },
];
