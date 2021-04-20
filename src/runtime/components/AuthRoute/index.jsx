import React from 'react'
import { Route} from 'react-router-dom'
import Forbidden from '../Forbidden'

let authCheckFn = () => true

export const setAuthCheckFn = (nextAuthCheckFn) =>  authCheckFn = nextAuthCheckFn

const AuthRoute = React.memo(({ authKey, fallback, ...restProps }) => {
  if (authKey && !authCheckFn(authKey)) {
    return <Route {...restProps} component={fallback || Forbidden}/>
  }

  return <Route {...restProps}/>
})

AuthRoute.setAuthCheckFn = setAuthCheckFn
export default AuthRoute