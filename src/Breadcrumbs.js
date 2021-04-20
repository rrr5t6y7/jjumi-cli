import { NavLink } from 'umi';
import withBreadcrumbs from 'react-router-breadcrumbs-hoc';
import routes from '../config.router';

// 更多配置请移步 https://github.com/icd2k3/react-router-breadcrumbs-hoc
export default withBreadcrumbs(routes)(({ breadcrumbs }) => {
  return (
    <div>
      {breadcrumbs.map((item, index) => (
        <span key={item.key}>
          {index === breadcrumbs.length - 1 ? (
            <span>{item.name}</span>
          ) : (
            <NavLink to={item.match.url}>{item.name}</NavLink>
          )}

          {index === breadcrumbs.length - 1 || index === 0 || index === 1
            ? ''
            : ' / '}
          {/* {index < breadcrumbs.length - breadcrumbs.length && <i> / </i>} */}
        </span>
      ))}
    </div>
  );
});
