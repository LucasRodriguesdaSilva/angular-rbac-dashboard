/**
 * Papeis do usuário
 */
export type UserRole = "ADMIN" | 'SUPPORT' | 'USER'

/**
 * Permissões do usuário
 */
export type UserPermission =
| 'users.read'
| 'users.create'
| 'users.update'
| 'users.delete'
| 'logs.read'

/**
 * Interface das informações do usuário
 *
 * @prop id           - ID do usuário
 * @prop email        - E-mail do usuário
 * @prop name         - Nome do usuário
 * @prop role         - Papel do usuário
 * @prop permissions  - Array de permissões do usuário
 */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: UserPermission[]
}

/**
 * Interface para informações do token
 *
 * @orop accessToken  - Token de acesso
 * @prop refreshToken - Refresh token
 */
export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

/**
 * Interface para informações do token Jwt
 */
export interface JwtPayload {
  sub: string
  email: string
  name: string
  role: UserRole
  permissions: UserPermission[]
  exp: number
}
