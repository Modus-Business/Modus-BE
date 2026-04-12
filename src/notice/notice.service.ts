import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { CreateNoticeRequestDto } from './dto/create-notice.request.dto';
import { DeleteNoticeResponseDto } from './dto/delete-notice.response.dto';
import { NoticeItemDto, NoticeListResponseDto } from './dto/notice.response.dto';
import { UpdateNoticeRequestDto } from './dto/update-notice.request.dto';
import { Notice } from './entities/notice.entity';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    @InjectRepository(ClassParticipant)
    private readonly classParticipantRepository: Repository<ClassParticipant>,
  ) {}

  async createNotice(
    currentUser: JwtPayload,
    request: CreateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 공지를 작성할 수 있습니다.');
    }

    const classroom = await this.getTeacherAccessibleClassroom(
      currentUser,
      request.classId,
    );

    const notice = this.noticeRepository.create({
      classId: classroom.classId,
      title: request.title.trim(),
      content: request.content.trim(),
    });
    const savedNotice = await this.noticeRepository.save(notice);

    return this.toNoticeItem(savedNotice);
  }

  async updateNotice(
    currentUser: JwtPayload,
    noticeId: string,
    request: UpdateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    const notice = await this.getTeacherOwnedNotice(currentUser, noticeId);

    notice.title = request.title.trim();
    notice.content = request.content.trim();

    const savedNotice = await this.noticeRepository.save(notice);

    return this.toNoticeItem(savedNotice);
  }

  async deleteNotice(
    currentUser: JwtPayload,
    noticeId: string,
  ): Promise<DeleteNoticeResponseDto> {
    const notice = await this.getTeacherOwnedNotice(currentUser, noticeId);

    await this.noticeRepository.remove(notice);

    return {
      message: '공지사항을 삭제했습니다.',
    };
  }

  async getNoticesByClass(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<NoticeListResponseDto> {
    await this.getAccessibleClassroom(currentUser, classId);

    const notices = await this.noticeRepository.find({
      where: {
        classId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      notices: notices.map((notice) => this.toNoticeItem(notice)),
    };
  }

  private async getTeacherOwnedNotice(
    currentUser: JwtPayload,
    noticeId: string,
  ): Promise<Notice> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException(
        '교강사만 공지를 수정하거나 삭제할 수 있습니다.',
      );
    }

    const notice = await this.noticeRepository.findOne({
      where: {
        noticeId,
      },
      relations: {
        classroom: true,
      },
    });

    if (!notice) {
      throw new NotFoundException('해당 공지사항을 찾을 수 없습니다.');
    }

    if (notice.classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException(
        '본인 수업의 공지만 수정하거나 삭제할 수 있습니다.',
      );
    }

    return notice;
  }

  private async getTeacherAccessibleClassroom(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<Classroom> {
    const classroom = await this.classroomRepository.findOne({
      where: {
        classId,
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업을 찾을 수 없습니다.');
    }

    if (classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException('본인 수업의 공지만 작성할 수 있습니다.');
    }

    return classroom;
  }

  private async getAccessibleClassroom(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<Classroom> {
    const classroom = await this.classroomRepository.findOne({
      where: {
        classId,
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업을 찾을 수 없습니다.');
    }

    if (currentUser.role === UserRole.TEACHER) {
      if (classroom.teacherId !== currentUser.sub) {
        throw new ForbiddenException('본인 수업의 공지만 조회할 수 있습니다.');
      }

      return classroom;
    }

    if (currentUser.role === UserRole.STUDENT) {
      const participant = await this.classParticipantRepository.findOne({
        where: {
          classId,
          studentId: currentUser.sub,
        },
      });

      if (!participant) {
        throw new ForbiddenException('본인이 참여한 수업의 공지만 조회할 수 있습니다.');
      }

      return classroom;
    }

    throw new ForbiddenException('지원하지 않는 사용자 역할입니다.');
  }

  private toNoticeItem(notice: Notice): NoticeItemDto {
    return {
      noticeId: notice.noticeId,
      classId: notice.classId,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt,
    };
  }
}
