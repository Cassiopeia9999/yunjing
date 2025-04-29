import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const JwtKey = 'Admin-Jwt'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}


export function getJwt() {
  return Cookies.get(JwtKey)
}

export function setJwt(token) {
  return Cookies.set(JwtKey, token)
}

export function removeJwt() {
  return Cookies.remove(JwtKey)
}