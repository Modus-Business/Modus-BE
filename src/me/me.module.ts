import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/signup/entities/user.entity';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User])],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
