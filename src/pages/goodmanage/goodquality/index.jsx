import { useEffect } from 'react';
import request from 'umi-request';
// import { requestURI } from '@/utils/runtime/service';

export default function Goodquality() {
  useEffect(() => {
    // 也可将 URL 的参数放到 options.params 里
    // request
    //   .get('/admin/api/users', {
    //     params: {
    //       id: 1,
    //     },
    //   })
    //   .then(function (response) {
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });
    // requestURI('/admin/api/users', { id: 4 }).then((response) => {
    //   console.log(response);
    // });
  }, []);
  return <div>goodquality</div>;
}
