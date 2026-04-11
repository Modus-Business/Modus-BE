import { extname } from 'node:path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { RefreshToken } from '../auth/login/refresh-token/entities/refresh-token.entity';
import { SignupVerification } from '../auth/signup/entities/signup-verification.entity';
import { User } from '../auth/signup/entities/user.entity';
import { AssignmentSubmission } from '../assignment/entities/assignment-submission.entity';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { Group } from '../group/entities/group.entity';
import { GroupMember } from '../group/entities/group-member.entity';
import { GroupNickname } from '../group/entities/group-nickname.entity';
import { Notice } from '../notice/entities/notice.entity';
import { Survey } from '../survey/entities/survey.entity';

const databaseEntities = [
  User,
  SignupVerification,
  RefreshToken,
  Classroom,
  ClassParticipant,
  Group,
  GroupMember,
  GroupNickname,
  Notice,
  AssignmentSubmission,
  Survey,
];

const parseBoolean = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
};

export const createDataSourceOptions = (
  env: NodeJS.ProcessEnv,
): DataSourceOptions => {
  const sslEnabled = parseBoolean(env.DB_SSL, false);
  const rejectUnauthorized = parseBoolean(
    env.DB_SSL_REJECT_UNAUTHORIZED,
    true,
  );
  const migrations =
    extname(__filename) === '.ts'
      ? ['src/database/migrations/*.ts']
      : ['dist/src/database/migrations/*.js'];

  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    database: env.DB_NAME ?? 'modus',
    entities: databaseEntities,
    migrations,
    synchronize: parseBoolean(env.DB_SYNCHRONIZE, false),
    ssl: sslEnabled ? { rejectUnauthorized } : false,
  };
};

export const createTypeOrmOptions = (
  env: NodeJS.ProcessEnv,
): TypeOrmModuleOptions => createDataSourceOptions(env);

export { databaseEntities };
