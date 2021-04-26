import { useEffect } from 'react';
import NoFoundPage from './404';
import request from 'umi-request';
// import { requestURI } from '@/utils/runtime/service';

export default function Exception(props) {
  useEffect(() => {
    console.log(props);
  }, []);
  return <div>Exception-404</div>;
}
