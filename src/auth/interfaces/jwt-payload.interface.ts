import { UserRole } from '../signup/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
}
