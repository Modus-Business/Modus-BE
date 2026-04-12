import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomInt } from 'node:crypto';
import { extname } from 'node:path';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatePresignedUploadUrlRequestDto } from './dto/create-presigned-upload-url.request.dto';
import { CreatePresignedUploadUrlResponseDto } from './dto/create-presigned-upload-url.response.dto';

const DEFAULT_PRESIGNED_EXPIRES_IN_SECONDS = 300;
const SAFE_FILE_NAME_PATTERN = /[^a-zA-Z0-9._-]/g;

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async createPresignedUploadUrl(
    currentUser: JwtPayload,
    request: CreatePresignedUploadUrlRequestDto,
  ): Promise<CreatePresignedUploadUrlResponseDto> {
    const normalizedFileName = this.normalizeFileName(request.fileName);
    const contentType = request.contentType.trim().toLowerCase();
    const { bucket, region, publicBaseUrl, s3Client } = this.getClientOptions();

    if (!contentType.includes('/')) {
      throw new BadRequestException('contentType 형식이 올바르지 않습니다.');
    }

    const purpose = request.purpose ?? 'assignments';
    const fileKey = this.createObjectKey(
      currentUser.sub,
      purpose,
      normalizedFileName,
    );
    const expiresInSeconds = Number(
      this.configService.get<string>(
        'AWS_S3_PRESIGNED_EXPIRES_IN',
        String(DEFAULT_PRESIGNED_EXPIRES_IN_SECONDS),
      ),
    );
    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    try {
      const uploadUrl = await getSignedUrl(s3Client, uploadCommand, {
        expiresIn: expiresInSeconds,
      });

      return {
        fileKey,
        fileUrl: this.createFileUrl(fileKey, bucket, region, publicBaseUrl),
        uploadUrl,
        expiresInSeconds,
      };
    } catch {
      throw new InternalServerErrorException(
        '업로드 URL을 생성하지 못했습니다.',
      );
    }
  }

  async createPresignedDownloadUrl(fileUrl: string): Promise<string> {
    const normalizedFileUrl = fileUrl.trim();
    const fileKey = this.extractObjectKey(normalizedFileUrl);
    const { bucket, s3Client } = this.getClientOptions();
    const expiresInSeconds = Number(
      this.configService.get<string>(
        'AWS_S3_PRESIGNED_EXPIRES_IN',
        String(DEFAULT_PRESIGNED_EXPIRES_IN_SECONDS),
      ),
    );
    const downloadCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    try {
      return await getSignedUrl(s3Client, downloadCommand, {
        expiresIn: expiresInSeconds,
      });
    } catch {
      throw new InternalServerErrorException(
        '다운로드 URL을 생성하지 못했습니다.',
      );
    }
  }

  private createObjectKey(
    userId: string,
    purpose: string,
    fileName: string,
  ): string {
    const now = new Date();
    const datePath = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
    ].join('/');
    const extension = extname(fileName);
    const baseName = extension
      ? fileName.slice(0, fileName.length - extension.length)
      : fileName;

    return `${purpose}/${datePath}/${userId}-${Date.now()}-${randomInt(1000, 10000)}-${baseName}${extension}`;
  }

  private createFileUrl(
    fileKey: string,
    bucket: string,
    region: string,
    publicBaseUrl: string | null,
  ): string {
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
  }

  private normalizeFileName(fileName: string): string {
    const trimmedFileName = fileName.trim();

    if (!trimmedFileName) {
      throw new BadRequestException('fileName은 비어 있을 수 없습니다.');
    }

    return trimmedFileName
      .replaceAll('\\', '-')
      .replaceAll('/', '-')
      .replace(SAFE_FILE_NAME_PATTERN, '-');
  }

  private extractObjectKey(fileUrl: string): string {
    let pathname: string;

    try {
      pathname = new URL(fileUrl).pathname;
    } catch {
      throw new BadRequestException('fileUrl 형식이 올바르지 않습니다.');
    }

    const fileKey = decodeURIComponent(pathname).replace(/^\/+/, '');

    if (!fileKey.startsWith('assignments/')) {
      throw new BadRequestException(
        'assignments 경로 파일만 다운로드할 수 있습니다.',
      );
    }

    return fileKey;
  }

  private getClientOptions(): {
    bucket: string;
    region: string;
    publicBaseUrl: string | null;
    s3Client: S3Client;
  } {
    const region = this.configService.get<string>('AWS_REGION');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const publicBaseUrl =
      this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL') ?? null;

    if (!region) {
      throw new InternalServerErrorException(
        'AWS_REGION 환경변수가 설정되지 않았습니다.',
      );
    }

    if (!bucket) {
      throw new InternalServerErrorException(
        'AWS_S3_BUCKET 환경변수가 설정되지 않았습니다.',
      );
    }

    if (!accessKeyId) {
      throw new InternalServerErrorException(
        'AWS_ACCESS_KEY_ID 환경변수가 설정되지 않았습니다.',
      );
    }

    if (!secretAccessKey) {
      throw new InternalServerErrorException(
        'AWS_SECRET_ACCESS_KEY 환경변수가 설정되지 않았습니다.',
      );
    }

    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    return {
      bucket,
      region,
      publicBaseUrl,
      s3Client: this.s3Client,
    };
  }
}
