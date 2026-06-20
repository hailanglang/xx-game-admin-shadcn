/**
 * API 统一入口
 *
 * 重导出 orval 生成的 hooks / 函数 / 类型，提供稳定的导入路径。
 * 业务代码统一从 @/api 导入，不直接引用 @/api/generated/*。
 * 当 orval 重新生成导致路径或方法名变化时，只需在此文件映射一次。
 */

// ── Auth ──
export {
  useAuthControllerLogin,
  useAuthControllerGetCurrentUser,
  getAuthControllerGetCurrentUserQueryOptions,
  authControllerGetCurrentUser,
  authControllerLogin,
} from '@/api/generated/auth/auth'

// ── 用户管理 ──
export {
  useUsersControllerFindAll,
  useUsersControllerFindOne,
  useUsersControllerCreate,
  useUsersControllerUpdate,
  useUsersControllerRemove,
  getUsersControllerFindAllQueryKey,
} from '@/api/generated/users/users'

// ── 角色管理 ──
export {
  useRolesControllerFindAll,
  useRolesControllerFindOne,
  useRolesControllerCreate,
  useRolesControllerUpdate,
  useRolesControllerRemove,
  useRolesControllerAssignPermissions,
  getRolesControllerFindAllQueryKey,
} from '@/api/generated/roles/roles'

// ── 文章管理 ──
export {
  usePostsControllerFindAll,
  usePostsControllerFindOne,
  usePostsControllerUpdate,
  usePostsControllerRemove,
  getPostsControllerFindAllQueryKey,
} from '@/api/generated/posts/posts'

// ── 权限管理 ──
export {
  usePermissionsControllerFindAll,
  usePermissionsControllerFindGrouped,
} from '@/api/generated/permissions/permissions'

// ── 系统管理 ──
export {
  useSystemControllerUpdateConfig,
  useSystemControllerFindAllLogs,
} from '@/api/generated/system/system'

// ── 类型 ──
export type {
  UserInfoDto,
  LoginDto,
  LoginResponseDto,
  UserDto,
  UserDetailDto,
  CreateUserDto,
  UpdateUserDto,
  PaginatedUserDto,
  RoleDto,
  RoleDetailDto,
  CreateRoleDto,
  PermissionGroupDto,
  PermissionItemDto,
  RolePermissionDto,
  AssignPermissionDto,
  PostDetailDto,
  UpdatePostDto,
  PostImageDto,
} from '@/api/generated/types'
