import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Group } from '../group/entities/group.entity';
import { NoticeService } from './notice.service';
import { Notice } from './entities/notice.entity';

describe('NoticeService', () => {
  let noticeService: NoticeService;
  let noticeRepository: jest.Mocked<Repository<Notice>>;
  let groupRepository: jest.Mocked<Repository<Group>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticeService,
        {
          provide: getRepositoryToken(Notice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Group),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    noticeService = module.get<NoticeService>(NoticeService);
    noticeRepository = module.get(getRepositoryToken(Notice));
    groupRepository = module.get(getRepositoryToken(Group));
  });

  it('교강사는 공지를 작성할 수 있다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      classroom: {
        teacherId: 'teacher-1',
      },
      groupMembers: [],
    } as unknown as Group);
    noticeRepository.create.mockImplementation((input) => input as Notice);
    noticeRepository.save.mockResolvedValue({
      noticeId: 'notice-1',
      groupId: 'group-1',
      title: '오늘 수업 공지',
      content: '오후 3시까지 초안 제출',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      group: undefined as never,
    } as Notice);

    const result = await noticeService.createNotice(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      {
        groupId: '11111111-1111-1111-1111-111111111111',
        title: '오늘 수업 공지',
        content: '오후 3시까지 초안 제출',
      },
    );

    expect(result.title).toBe('오늘 수업 공지');
  });

  it('교강사는 공지를 수정할 수 있다', async () => {
    noticeRepository.findOne.mockResolvedValue({
      noticeId: 'notice-1',
      groupId: 'group-1',
      title: '기존 제목',
      content: '기존 내용',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      group: {
        classroom: {
          teacherId: 'teacher-1',
        },
      },
    } as unknown as Notice);
    noticeRepository.save.mockImplementation(async (input) => input as Notice);

    const result = await noticeService.updateNotice(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      '11111111-1111-1111-1111-111111111111',
      {
        title: '수정된 제목',
        content: '수정된 내용',
      },
    );

    expect(result.title).toBe('수정된 제목');
    expect(result.content).toBe('수정된 내용');
  });

  it('교강사는 공지를 삭제할 수 있다', async () => {
    const notice = {
      noticeId: 'notice-1',
      groupId: 'group-1',
      title: '기존 제목',
      content: '기존 내용',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      group: {
        classroom: {
          teacherId: 'teacher-1',
        },
      },
    } as unknown as Notice;
    noticeRepository.findOne.mockResolvedValue(notice);
    noticeRepository.remove.mockResolvedValue(notice);

    const result = await noticeService.deleteNotice(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result.message).toBe('공지사항이 삭제되었습니다.');
  });

  it('수강생은 본인 모둠 공지 목록을 조회할 수 있다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      classroom: {
        teacherId: 'teacher-1',
      },
      groupMembers: [
        {
          classParticipant: {
            studentId: 'student-1',
          },
        },
      ],
    } as unknown as Group);
    noticeRepository.find.mockResolvedValue([
      {
        noticeId: 'notice-1',
        groupId: 'group-1',
        title: '오늘 수업 공지',
        content: '오후 3시까지 초안 제출',
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
        updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      } as Notice,
    ]);

    const result = await noticeService.getNoticesByGroup(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result.notices).toHaveLength(1);
  });

  it('본인 모둠이 아니면 수강생은 공지에 접근할 수 없다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      classroom: {
        teacherId: 'teacher-1',
      },
      groupMembers: [],
    } as unknown as Group);

    await expect(
      noticeService.getNoticesByGroup(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        '11111111-1111-1111-1111-111111111111',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

});
