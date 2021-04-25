import React, { useEffect, useState } from 'react';
import styles from './index.less';
import { Form, Input, Button, Checkbox } from 'antd';
// import request from 'umi-request';
import request from '@/utils/request.js';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import logoHead from '../../../assets/images/loginHead.jpeg';

const NormalLoginForm = () => {
  // const [form] = Form.useForm();
  const [imgKey, updateKey] = useState(Date.now());
  const fetchLogin = (values: object) => {
    const formdata = new FormData();
    formdata.append('account', values.account);
    formdata.append('password', values.password);
    formdata.append('captchaId', values.captchaId);
    request
      .post('http://59.110.217.39:8050/login', { data: formdata })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const fetchCaptcha = () => {
    request
      .get('http://59.110.217.39:8050/captcha', {
        params: {},
      })
      .then(function (response) {
        let a = window.URL.createObjectURL(response);
        console.log(a);
        // console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const onFinish = (values: object) => {
    console.log('Received values of form: ', values);
    fetchLogin(values);
  };

  const updateImg = () => {
    updateKey(Date.now());
  };

  return (
    <div className={styles.loginBox}>
      <img src={logoHead} className={styles.loginHead} />
      <Form
        name="normal_login"
        className="login-form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          name="account"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="请输入用户名"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="请输入密码"
          />
        </Form.Item>
        <Form.Item
          name="captchaId"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <Input style={{ width: 200 }} placeholder="请输入验证码" />
        </Form.Item>
        <div className={styles.captchaIdImgSty}>
          <img
            src="http://www.zchiu.ltd:8050/captcha"
            onClick={updateImg}
            key={imgKey}
          />
        </div>
        {/*<Form.Item>
         <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>记住我</Checkbox>
        </Form.Item>

         <a className="login-form-forgot" href="">
          忘记密码
        </a>
      </Form.Item>*/}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            登录
          </Button>
          Or <a href="">立即注册!</a>
        </Form.Item>
      </Form>
    </div>
  );
};

export default () => (
  <div className={styles.container}>
    <div id="components-form-demo-normal-login">
      <NormalLoginForm />
    </div>
  </div>
);
