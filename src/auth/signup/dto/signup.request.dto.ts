import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class SignupRequestDto {
  @ApiProperty({ example: '홍길동' })
  @IsString()
  @Length(2, 30)
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @Length(8, 30)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.',
  })
  password!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @Length(8, 30)
  passwordConfirmation!: string;
}
