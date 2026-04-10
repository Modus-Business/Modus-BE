import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Group } from '../group/entities/group.entity';
import { CreateNoticeRequestDto } from './dto/create-notice.request.dto';
import { DeleteNoticeResponseDto } from './dto/delete-notice.response.dto';
import {
  NoticeItemDto,
  NoticeLatestResponseDto,
  NoticeListResponseDto,
} from './dto/notice.response.dto';
import { UpdateNoticeRequestDto } from './dto/update-notice.request.dto';
import { Notice } from './entities/notice.entity';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async createNotice(
    currentUser: JwtPayload,
    request: CreateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 공지를 작성할 수 있습니다.');
    }

    const group = await this.getAccessibleGroup(currentUser, request.groupId);

    const notice = this.noticeRepository.create({
      groupId: group.groupId,
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
      message: '공지사항이 삭제되었습니다.',
    };
  }

  async getNoticesByGroup(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<NoticeListResponseDto> {
    await this.getAccessibleGroup(currentUser, groupId);

    const notices = await this.noticeRepository.find({
      where: {
        groupId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      notices: notices.map((notice) => this.toNoticeItem(notice)),
    };
  }

  async getLatestNotice(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<NoticeLatestResponseDto> {
    await this.getAccessibleGroup(currentUser, groupId);

    const latestNotice = await this.noticeRepository.findOne({
      where: {
        groupId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      notice: latestNotice ? this.toNoticeItem(latestNotice) : null,
    };
  }

  private async getTeacherOwnedNotice(
    currentUser: JwtPayload,
    noticeId: string,
  ): Promise<Notice> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 공지를 수정하거나 삭제할 수 있습니다.');
    }

    const notice = await this.noticeRepository.findOne({
      where: {
        noticeId,
      },
      relations: {
        group: {
          classroom: true,
        },
      },
    });

    if (!notice) {
      throw new NotFoundException('해당 공지사항을 찾을 수 없습니다.');
    }

    if (notice.group.classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException(
        '본인이 만든 수업의 공지만 수정하거나 삭제할 수 있습니다.',
      );
    }

    return notice;
  }

  private async getAccessibleGroup(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        groupId,
      },
      relations: {
        classroom: true,
        groupMembers: {
          classParticipant: true,
        },
      },
    });

    if (!group) {
      throw new NotFoundException('해당 모둠을 찾을 수 없습니다.');
    }

    if (currentUser.role === UserRole.TEACHER) {
      if (group.classroom.teacherId !== currentUser.sub) {
        throw new ForbiddenException(
          '본인이 만든 수업의 모둠 공지만 접근할 수 있습니다.',
        );
      }

      return group;
    }

    if (currentUser.role === UserRole.STUDENT) {
      const isMember = group.groupMembers.some(
        (groupMember) =>
          groupMember.classParticipant.studentId === currentUser.sub,
      );

      if (!isMember) {
        throw new ForbiddenException('본인이 속한 모둠 공지만 접근할 수 있습니다.');
      }

      return group;
    }

    throw new ForbiddenException('지원하지 않는 사용자 역할입니다.');
  }

  private toNoticeItem(notice: Notice): NoticeItemDto {
    return {
      noticeId: notice.noticeId,
      groupId: notice.groupId,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt,
    };
  }
}
