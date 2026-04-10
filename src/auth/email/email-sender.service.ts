import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

type MailerConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

@Injectable()
export class EmailSenderService {
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.getTransporter().sendMail({
      from: this.getMailerConfig().from,
      to: email,
      subject: '[Modus] 이메일 인증 코드',
      text: `인증 코드는 ${code} 입니다. 10분 안에 입력해 주세요.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">이메일 인증 코드</h2>
          <p>아래 인증 코드를 10분 안에 입력해 주세요.</p>
          <div style="margin: 24px 0; padding: 16px 20px; border-radius: 12px; background: #eff6ff; font-size: 28px; font-weight: 700; letter-spacing: 6px; width: fit-content;">
            ${code}
          </div>
          <p>본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
        </div>
      `,
    });
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const config = this.getMailerConfig();

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password,
        },
      });
    }

    return this.transporter;
  }

  private getMailerConfig(): MailerConfig {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASSWORD');
    const from = this.configService.get<string>('MAIL_FROM');
    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const secure =
      this.configService.get<string>('MAIL_SECURE', 'false') === 'true';

    if (!host) {
      throw new Error('MAIL_HOST 환경변수가 설정되지 않았습니다.');
    }

    if (!user) {
      throw new Error('MAIL_USER 환경변수가 설정되지 않았습니다.');
    }

    if (!password) {
      throw new Error('MAIL_PASSWORD 환경변수가 설정되지 않았습니다.');
    }

    if (!from) {
      throw new Error('MAIL_FROM 환경변수가 설정되지 않았습니다.');
    }

    return {
      host,
      port,
      secure,
      user,
      password,
      from,
    };
  }
}
