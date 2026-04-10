import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import nodemailer from 'nodemailer';
import { EmailSenderService } from './email-sender.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('EmailSenderService', () => {
  let emailSenderService: EmailSenderService;
  const sendMail = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    sendMail.mockReset();
    sendMail.mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailSenderService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                MAIL_HOST: 'smtp.gmail.com',
                MAIL_PORT: '587',
                MAIL_SECURE: 'false',
                MAIL_USER: 'modus@example.com',
                MAIL_PASSWORD: 'app-password',
                MAIL_FROM: 'modus@example.com',
              };

              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    emailSenderService = module.get<EmailSenderService>(EmailSenderService);
  });

  it('sends verification email with the given code', async () => {
    await emailSenderService.sendVerificationCode(
      'student@example.com',
      '123456',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'modus@example.com',
        pass: 'app-password',
      },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'modus@example.com',
        to: 'student@example.com',
        subject: '[Modus] 이메일 인증 코드',
      }),
    );
  });
});
