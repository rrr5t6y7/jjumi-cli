import FormNormalLogin from './FormNormalLogin';
import styles from './index.less';

export default function Login() {
  return (
    <div className={styles.loginBox}>
      <FormNormalLogin />
    </div>
  );
}
