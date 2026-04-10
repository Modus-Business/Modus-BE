import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../auth/signup/enums/user-role.enum';

export class MeSettingsResponseDto {
  @ApiProperty({ example: '최민수' })
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: false })
  isEmailVerified!: boolean;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  role!: UserRole;
}
