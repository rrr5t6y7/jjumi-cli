/*
 * @Author: JJ
 * @Date: 2020-05-27 19:11:03
 * @Last Modified by: JJ
 * @Last Modified time: 2021-04-22 14:51:51
 */

//  example
const apiPrefix = '/v1/ex';

module.exports = {
  'mall.manager.list': `${apiPrefix}/store/list`, // 列表
  'mall.manager.enabled': `${apiPrefix}/store/update-status`, // 启用/禁用
  'mall.manager.get': `${apiPrefix}/store/get`, // 详情
  'mall.manager.setting': `${apiPrefix}/store/setting`, //设置数量
  'mall.manager.listVersionRecord': `${apiPrefix}/store/list-version-record`, // 设置数量
  'mall.manager.updateVersion': `${apiPrefix}/store/update-version`, // 更新服务版本
  'mall.manager.companyGet': `${apiPrefix}/company/get`, // 获得公司信息
  'mall.manager.records': `${apiPrefix}/company/records`, // 查询认证记录
  'mall.manager.audit': `${apiPrefix}/company/audit`, // 审核/驳回
  'mall.manager.version': `${apiPrefix}/store/service-version`, // 功能开通
  'mall.manager.operateLogList': `${apiPrefix}/operate-log/store/list`, // 商城操作日志
  'mall.manager.serviceList': `${apiPrefix}/service/list`, // 商城订购
  'mall.manager.remark': `${apiPrefix}/service/remark`, // 商城备注
  'mall.manager.remarkList': `${apiPrefix}/service/remark/list`, // 商城备注记录
  'mall.manager.merchantQuery': `${apiPrefix}/store/split-receiver/list`, // 商城分账列表
  'mall.manager.infoQuery': `${apiPrefix}/store/split-receiver/query`, // 商城分账
  'mall.manager.merchantAudit': `${apiPrefix}/store/split-receiver/audit`, // 审核/驳回
  'mall.manager.categoList': `${apiPrefix}/category/list`, // 商城类目列表
  'mall.manager.save': `${apiPrefix}/category/save`, // 商城类目新建
  'mall.manager.update': `${apiPrefix}/category/update`, // 商城类目修改
  'mall.manager.delete': `${apiPrefix}/category/delete`, // 商城类目删除
  'mall.manager.sort': `${apiPrefix}/category/sort`, // 商城类目排序
  'mall.manager.basicList': `${apiPrefix}/service-package/basic-list`, // 商城类目排序
};
