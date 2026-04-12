import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { NoticeService } from './notice.service';
import { Notice } from './entities/notice.entity';

describe('NoticeService', () => {
  let noticeService: NoticeService;
  let noticeRepository: jest.Mocked<Repository<Notice>>;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;
  let classParticipantRepository: jest.Mocked<Repository<ClassParticipant>>;

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
          provide: getRepositoryToken(Classroom),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClassParticipant),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    noticeService = module.get<NoticeService>(NoticeService);
    noticeRepository = module.get(getRepositoryToken(Notice));
    classroomRepository = module.get(getRepositoryToken(Classroom));
    classParticipantRepository = module.get(
      getRepositoryToken(ClassParticipant),
    );
  });

  it('교강사는 수업 공지를 작성할 수 있다', async () => {
    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '소프트웨어 공학',
    } as Classroom);
    noticeRepository.create.mockImplementation((input) => input as Notice);
    noticeRepository.save.mockResolvedValue({
      noticeId: 'notice-1',
      classId: 'class-1',
      title: '오늘 수업 공지',
      content: '오후 3시까지 초안 제출',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
    } as Notice);

    const result = await noticeService.createNotice(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      {
        classId: '11111111-1111-1111-1111-111111111111',
        title: '오늘 수업 공지',
        content: '오후 3시까지 초안 제출',
      },
    );

    expect(result.title).toBe('오늘 수업 공지');
    expect(result.classId).toBe('class-1');
  });

  it('교강사는 공지를 수정할 수 있다', async () => {
    noticeRepository.findOne.mockResolvedValue({
      noticeId: 'notice-1',
      classId: 'class-1',
      title: '기존 제목',
      content: '기존 내용',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      classroom: {
        teacherId: 'teacher-1',
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
      classId: 'class-1',
      title: '기존 제목',
      content: '기존 내용',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      classroom: {
        teacherId: 'teacher-1',
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

    expect(result.message).toBe('공지사항을 삭제했습니다.');
  });

  it('학생은 자신이 참여한 수업의 공지 목록을 조회할 수 있다', async () => {
    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '소프트웨어 공학',
    } as Classroom);
    classParticipantRepository.findOne.mockResolvedValue({
      classParticipantId: 'participant-1',
      classId: 'class-1',
      studentId: 'student-1',
    } as ClassParticipant);
    noticeRepository.find.mockResolvedValue([
      {
        noticeId: 'notice-1',
        classId: 'class-1',
        title: '오늘 수업 공지',
        content: '오후 3시까지 초안 제출',
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
        updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      } as Notice,
    ]);

    const result = await noticeService.getNoticesByClass(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result.notices).toHaveLength(1);
    expect(result.notices[0].classId).toBe('class-1');
  });

  it('참여하지 않은 학생은 수업 공지를 조회할 수 없다', async () => {
    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '소프트웨어 공학',
    } as Classroom);
    classParticipantRepository.findOne.mockResolvedValue(null);

    await expect(
      noticeService.getNoticesByClass(
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
