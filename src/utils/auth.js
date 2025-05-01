import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const JwtKey = 'Admin-Jwt'
const TenantKey = 'tenantId'

// token
export function getToken() {
  return Cookies.get(TokenKey) || localStorage.getItem(TokenKey)
}

export function setToken(token) {
  Cookies.set(TokenKey, token)
  localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  Cookies.remove(TokenKey)
  localStorage.removeItem(TokenKey)
}

// jwt
export function getJwt() {
  return Cookies.get(JwtKey) || localStorage.getItem(JwtKey)
}

export function setJwt(token) {
  Cookies.set(JwtKey, token)
  localStorage.setItem(JwtKey, token)
}

export function removeJwt() {
  Cookies.remove(JwtKey)
  localStorage.removeItem(JwtKey)
}

// tenantId
export function getTenantId() {
  return Cookies.get(TenantKey) || localStorage.getItem(TenantKey)
}

export function setTenantId(tenantId) {
  Cookies.set(TenantKey, tenantId)
  localStorage.setItem(TenantKey, tenantId)
}

export function removeTenantId() {
  Cookies.remove(TenantKey)
  localStorage.removeItem(TenantKey)
}
