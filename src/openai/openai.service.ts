import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Survey } from '../survey/entities/survey.entity';

type ResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export type GeneratedNickname = {
  nickname: string;
  reason: string;
};

@Injectable()
export class OpenAiService {
  private static readonly DEFAULT_MODEL = 'gpt-5-nano';

  constructor(private readonly configService: ConfigService) {}

  async generateStudentNickname(params: {
    survey: Survey | null;
    attemptedNicknames: string[];
  }): Promise<GeneratedNickname> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY가 설정되지 않아 AI 닉네임을 생성할 수 없습니다.',
      );
    }

    const model =
      this.configService.get<string>('OPENAI_MODEL')?.trim() ??
      OpenAiService.DEFAULT_MODEL;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: [
                  '너는 학생 협업 서비스의 익명 닉네임 생성기다.',
                  '학생 설문을 참고해 익명성이 유지되는 한국어 닉네임 한 개만 생성하라.',
                  '출력은 JSON 객체 하나만 반환하라.',
                  '형식은 {"nickname":"...", "reason":"..."} 이어야 한다.',
                  'reason은 1문장, 60자 이내의 한국어 설명으로 작성하라.',
                  '이름, 학교, 지역, 외모, 성별, 연락처, 능력 평가, 질병, 종교 같은 민감하거나 개인을 특정할 수 있는 정보는 넣지 마라.',
                  'MBTI를 직접 드러내지 마라.',
                  '2단어 또는 3단어의 자연스러운 한국어 닉네임으로 만들고 30자 이내로 유지하라.',
                  '같은 요청에서 이미 시도한 닉네임을 반복하지 마라.',
                ].join(' '),
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify(
                  {
                    survey: {
                      mbti: params.survey?.mbti ?? null,
                      personality: params.survey?.personality ?? null,
                      preference: params.survey?.preference ?? null,
                    },
                    attemptedNicknames: params.attemptedNicknames,
                  },
                  null,
                  2,
                ),
              },
            ],
          },
        ],
      }),
    });

    const data = (await response.json()) as ResponsesApiResponse;

    if (!response.ok) {
      throw new InternalServerErrorException(
        data.error?.message ??
          'OpenAI 응답 생성에 실패해 닉네임을 생성할 수 없습니다.',
      );
    }

    const outputText = this.extractOutputText(data).trim();
    const parsed = this.parseNicknameResponse(outputText);

    if (!parsed.nickname || !parsed.reason) {
      throw new InternalServerErrorException(
        'OpenAI가 닉네임 또는 설명을 비어 있는 값으로 반환했습니다.',
      );
    }

    return parsed;
  }

  private extractOutputText(response: ResponsesApiResponse): string {
    if (typeof response.output_text === 'string' && response.output_text.trim()) {
      return response.output_text;
    }

    for (const item of response.output ?? []) {
      for (const content of item.content ?? []) {
        if (content.type === 'output_text' && typeof content.text === 'string') {
          return content.text;
        }
      }
    }

    return '';
  }

  private parseNicknameResponse(outputText: string): GeneratedNickname {
    try {
      const parsed = JSON.parse(outputText) as Partial<GeneratedNickname>;

      return {
        nickname: typeof parsed.nickname === 'string' ? parsed.nickname.trim() : '',
        reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : '',
      };
    } catch {
      throw new InternalServerErrorException(
        'OpenAI 닉네임 응답을 JSON으로 해석하지 못했습니다.',
      );
    }
  }
}
