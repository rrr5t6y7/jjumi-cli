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

// 路由
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
        path: `${basePath}/task_manage`,
        component: '@/pages/taskmanage',
        name: '任务领取',
      },
      {
        exact: true,
        path: `${basePath}/taskmanage/good_number`,
        component: '@/pages/taskmanage/goodnumber',
        name: '商品数量',
      },
      {
        exact: true,
        path: `${basePath}/taskmanage/good_quality`,
        component: '@/pages/taskmanage/goodquality/index.jsx',
        name: '商品质量',
      },
      {
        exact: true,
        path: `${basePath}/reward_manage`,
        component: '@/pages/rewardmanage',
        name: '薪酬赏金',
      },
      {
        exact: true,
        path: `${basePath}/training`,
        component: '@/pages/training',
        name: '训练场',
      },
      {
        exact: true,
        path: `${basePath}/exam`,
        component: '@/pages/exam',
        name: '评级考试',
      },
      {
        exact: true,
        path: `${basePath}/monster_level`,
        component: '@/pages/monsterLevel',
        name: '怪人等级',
      },
      {
        exact: true,
        path: `${basePath}/monster_association`,
        component: '@/pages/monsterAssociation',
        name: '怪人协会',
      },
      {
        exact: true,
        path: `${basePath}/punishment_for_violation_of_regulations`,
        component: '@/pages/punishmentForViolationOfRegulations',
        name: '英雄违规处罚',
      },
      {
        exact: true,
        path: `${basePath}/personal`,
        component: '@/pages/personal',
        name: '英雄个人中心',
      },
      {
        exact: true,
        path: `${basePath}/service`,
        component: '@/pages/service',
        name: '客服反馈',
      },
      {
        exact: true,
        path: `${basePath}/Hero_management_association`,
        component: '@/pages/heroManagementAssociation',
        name: '英雄管理协会简介',
      },

      { path: '*', component: '@/pages/exception/404' },
    ],
  },
  { path: '*', redirect: `${basePath}/exception/404` },
];

// 菜单
export const menus = [
  // 菜单的配置项，用于动态渲染 key:	唯一标志 title: 菜单项值 path：用于路由跳转
  {
    key: 'task_manage',
    title: '任务领取',
    children: [
      {
        key: 'good_number',
        title: '商品数量',
        path: `${basePath}/task_manage/good_number`,
      },
      {
        key: 'good_quality',
        title: '商品质量',
        path: `${basePath}/task_manage/good_quality`,
      },
    ],
  },
  {
    key: 'reward_manage',
    title: '薪酬赏金',
    children: [
      {
        key: 'my_address',
        title: '我的地址',
        path: `${basePath}/reward_manage/my_address`,
      },
    ],
  },
  {
    exact: true,
    path: `${basePath}/training`,
    title: '训练场',
  },
  {
    exact: true,
    path: `${basePath}/exam`,
    title: '评级考试',
  },
  {
    exact: true,
    path: `${basePath}/monster_level`,
    title: '怪人等级',
  },
  {
    exact: true,
    path: `${basePath}/monster_association`,
    title: '怪人协会',
  },
  {
    exact: true,
    path: `${basePath}/punishment_for_violation_of_regulations`,
    title: '英雄违规处罚',
  },
  {
    exact: true,
    path: `${basePath}/personal`,
    title: '英雄个人中心',
  },
  {
    exact: true,
    path: `${basePath}/service`,
    title: '客服反馈',
  },
  {
    exact: true,
    path: `${basePath}/Hero_management_association`,
    title: '英雄管理协会简介',
  },
];
