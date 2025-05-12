import Cookies from 'js-cookie'

// Key 常量
const TokenKey = 'Admin-Token'
const JwtKey = 'Admin-Jwt'
const TenantKey = 'tenantId'

// Cookie 配置（可选，根据项目需要调整）
const cookieOptions = {
  path: '/',
  // secure: true,      // 开启 HTTPS 时建议打开
  // sameSite: 'Strict', // 推荐防 CSRF
  // expires: 7         // 设置 7 天有效期
}

// ===== token =====
export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  Cookies.set(TokenKey, token, cookieOptions)
}

export function removeToken() {
  Cookies.remove(TokenKey, cookieOptions)
}

// ===== jwt =====
export function getJwt() {
  return Cookies.get(JwtKey)
}

export function setJwt(jwt) {
  Cookies.set(JwtKey, jwt, cookieOptions)
}

export function removeJwt() {
  Cookies.remove(JwtKey, cookieOptions)
}

// ===== tenantId =====
export function getTenantId() {
  return Cookies.get(TenantKey)
}

export function setTenantId(tenantId) {
  Cookies.set(TenantKey, tenantId, cookieOptions)
}

export function removeTenantId() {
  Cookies.remove(TenantKey, cookieOptions)
}
