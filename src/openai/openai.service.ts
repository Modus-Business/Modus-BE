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

export type GeneratedMessageAdvice = {
  riskLevel: 'low' | 'medium' | 'high';
  shouldBlock: boolean;
  warning: string;
  suggestedRewrite: string | null;
};

export type GeneratedInterventionAdvice = {
  interventionNeeded: boolean;
  interventionType: 'none' | 'participation' | 'deep_question' | 'stalled_discussion';
  reason: string;
  suggestedMessage: string | null;
};

export type GeneratedContributionAnalysis = {
  summary: string;
  members: Array<{
    nickname: string;
    contributionScore: number;
    contributionTypes: Array<
      | 'initiator'
      | 'idea_provider'
      | 'questioner'
      | 'summarizer'
      | 'facilitator'
      | 'executor'
    >;
    reason: string;
  }>;
};

type ResponseRequestParams<T> = {
  instructions: string[];
  userPayload: unknown;
  parser: (outputText: string) => T;
  fallbackErrorMessage: string;
  timeoutMs: number;
  maxRetries: number;
  maxOutputTokens: number;
};

@Injectable()
export class OpenAiService {
  private static readonly DEFAULT_MODEL = 'gpt-5-nano';

  constructor(private readonly configService: ConfigService) {}

  async generateStudentNickname(params: {
    survey: Survey | null;
    attemptedNicknames: string[];
  }): Promise<GeneratedNickname> {
    return this.requestStructuredResponse({
      instructions: [
        '너는 학생 협업 서비스의 익명 닉네임 생성기다.',
        '학생 설문을 참고해 익명성이 유지되는 한국어 닉네임 한 개만 생성하라.',
        '출력은 JSON 객체 하나만 반환하라.',
        '형식은 {"nickname":"...", "reason":"..."} 이다.',
        'reason은 40자 이내의 한국어 한 문장으로 작성하라.',
        '이름, 학교, 지역, 외모, 성별, 연락처, 능력 평가, 질병, 종교 같은 민감하거나 개인을 특정할 수 있는 정보는 넣지 마라.',
        'MBTI를 직접 드러내지 마라.',
        '2단어 또는 3단어의 자연스러운 한국어 닉네임으로 만들고 30자 이내로 유지하라.',
        '이미 시도한 닉네임은 다시 제안하지 마라.',
      ],
      userPayload: {
        survey: {
          mbti: params.survey?.mbti ?? null,
          personality: params.survey?.personality ?? null,
          preference: params.survey?.preference ?? null,
        },
        attemptedNicknames: params.attemptedNicknames,
      },
      parser: (outputText) => this.parseNicknameResponse(outputText),
      fallbackErrorMessage:
        'OpenAI 응답 생성에 실패해 닉네임을 생성할 수 없습니다.',
      timeoutMs: 5000,
      maxRetries: 0,
      maxOutputTokens: 80,
    });
  }

  async generateMessageAdvice(params: {
    content: string;
    recentMessages: string[];
  }): Promise<GeneratedMessageAdvice> {
    try {
      return await this.requestStructuredResponse({
        instructions: [
          '너는 학생 협업 서비스의 전송 전 문장 조언기다.',
          '입력 문장이 상대에게 상처를 줄 가능성을 판단하고 필요하면 부드러운 수정 제안을 하라.',
          '정책 위반 수준이 아니라면 무조건 차단하지 말고 수정 제안을 우선하라.',
          '출력은 JSON 객체 하나만 반환하라.',
          '형식은 {"riskLevel":"low|medium|high","shouldBlock":boolean,"warning":"...","suggestedRewrite":"..."|null} 이다.',
          'warning은 40자 이내의 한국어 한 문장으로 작성하라.',
          'suggestedRewrite는 원래 의미를 유지하면서 40자 이내의 한국어 한 문장으로 제안하라.',
          '문제가 거의 없으면 shouldBlock=false, riskLevel=low, suggestedRewrite=null 로 반환하라.',
        ],
        userPayload: {
          content: params.content,
          recentMessages: params.recentMessages,
        },
        parser: (outputText) => this.parseMessageAdviceResponse(outputText),
        fallbackErrorMessage:
          'OpenAI 응답 생성에 실패해 메시지 조언을 만들 수 없습니다.',
        timeoutMs: 3500,
        maxRetries: 0,
        maxOutputTokens: 80,
      });
    } catch {
      return {
        riskLevel: 'low',
        shouldBlock: false,
        warning: '표현을 한 번 더 확인해 보세요.',
        suggestedRewrite: null,
      };
    }
  }

  async generateInterventionAdvice(params: {
    recentMessages: string[];
    participantNicknames: string[];
    participantMessageCounts: Record<string, number>;
  }): Promise<GeneratedInterventionAdvice> {
    try {
      return await this.requestStructuredResponse({
        instructions: [
          '너는 학생 협업 서비스의 그룹 대화 퍼실리테이터다.',
          '최근 대화를 분석해 참여를 넓히거나 논의를 더 깊게 만들 개입이 필요한지 판단하라.',
          '특정 사용자를 공개적으로 소외되었다고 지목하지 마라.',
          'participantNicknames에 있는 사람 중 최근 발화가 없는 사람도 반드시 고려하라.',
          '개입이 필요하면 전체 그룹에게 자연스럽게 던질 짧은 한국어 메시지 한 문장을 제안하라.',
          '출력은 JSON 객체 하나만 반환하라.',
          '형식은 {"interventionNeeded":boolean,"interventionType":"none|participation|deep_question|stalled_discussion","reason":"...","suggestedMessage":"..."|null} 이다.',
          'reason은 40자 이내의 한국어 한 문장으로 작성하라.',
          'suggestedMessage는 40자 이내의 한국어 한 문장으로 작성하라.',
          '대화가 충분히 건강하고 활발하면 interventionNeeded=false, interventionType="none", suggestedMessage=null 로 반환하라.',
        ],
        userPayload: {
          recentMessages: params.recentMessages,
          participantNicknames: params.participantNicknames,
          participantMessageCounts: params.participantMessageCounts,
        },
        parser: (outputText) => this.parseInterventionAdviceResponse(outputText),
        fallbackErrorMessage:
          'OpenAI 응답 생성에 실패해 대화 개입 조언을 만들 수 없습니다.',
        timeoutMs: 3500,
        maxRetries: 0,
        maxOutputTokens: 100,
      });
    } catch {
      return {
        interventionNeeded: false,
        interventionType: 'none',
        reason: '현재는 별도 개입 없이 진행해도 괜찮아요.',
        suggestedMessage: null,
      };
    }
  }

  async generateContributionAnalysis(params: {
    recentMessages: string[];
    participantNicknames: string[];
    participantMessageCounts: Record<string, number>;
  }): Promise<GeneratedContributionAnalysis> {
    try {
      return await this.requestStructuredResponse({
        instructions: [
          '너는 학생 협업 서비스의 기여도 분석 보조기다.',
          '메시지 수보다 역할과 실제 기여를 중심으로 최근 대화를 분석하라.',
          'participantNicknames에 있는 모든 참여자를 반드시 결과에 포함하라.',
          '최근 발화가 적거나 없더라도 members 배열에서 누락하지 마라.',
          '역할은 initiator, idea_provider, questioner, summarizer, facilitator, executor만 사용하라.',
          '메시지 개수만으로 높게 평가하지 말고 행동 기반으로만 판단하라.',
          '성격 추정, 능력 평가, 도덕 판단은 금지한다.',
          '출력은 JSON 객체 하나만 반환하라.',
          '형식은 {"summary":"...","members":[{"nickname":"...","contributionScore":0,"contributionTypes":["..."],"reason":"..."}]} 이다.',
          'summary는 2문장 이내의 한국어로 작성하라.',
          '각 reason은 2~3문장의 한국어 설명으로 작성하라.',
          '기여 근거가 약하면 contributionTypes는 빈 배열이어도 된다.',
          'contributionTypes는 0개 이상 2개 이하로 제한하라.',
          'contributionScore는 0~100 정수로 반환하라.',
        ],
        userPayload: {
          recentMessages: params.recentMessages,
          participantNicknames: params.participantNicknames,
          participantMessageCounts: params.participantMessageCounts,
        },
        parser: (outputText) => this.parseContributionAnalysisResponse(outputText),
        fallbackErrorMessage:
          'OpenAI 응답 생성에 실패해 기여도 분석을 만들 수 없습니다.',
        timeoutMs: 5000,
        maxRetries: 0,
        maxOutputTokens: 320,
      });
    } catch {
      return {
        summary: '최근 대화 기준으로 기여도를 빠르게 정리했습니다.',
        members: params.participantNicknames.map((nickname) => ({
          nickname,
          contributionScore: 0,
          contributionTypes: [],
          reason:
            '분석 응답이 지연되어 기본값으로 표시했습니다. 최근 대화 기준 추가 확인이 필요합니다.',
        })),
      };
    }
  }

  private async requestStructuredResponse<T>(
    params: ResponseRequestParams<T>,
  ): Promise<T> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY가 설정되지 않아 AI 기능을 사용할 수 없습니다.',
      );
    }

    const model =
      this.configService.get<string>('OPENAI_MODEL')?.trim() ??
      OpenAiService.DEFAULT_MODEL;

    for (let attempt = 0; attempt <= params.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            max_output_tokens: params.maxOutputTokens,
            input: [
              {
                role: 'developer',
                content: [
                  {
                    type: 'input_text',
                    text: params.instructions.join(' '),
                  },
                ],
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: JSON.stringify(params.userPayload, null, 2),
                  },
                ],
              },
            ],
          }),
        });
        const data = (await response.json()) as ResponsesApiResponse;

        if (!response.ok) {
          if (
            attempt < params.maxRetries &&
            this.shouldRetryStatus(response.status)
          ) {
            continue;
          }

          throw new InternalServerErrorException(
            data.error?.message ?? params.fallbackErrorMessage,
          );
        }

        return params.parser(this.extractOutputText(data).trim());
      } catch (error) {
        if (attempt < params.maxRetries && this.shouldRetryError(error)) {
          continue;
        }

        if (error instanceof InternalServerErrorException) {
          throw error;
        }

        throw new InternalServerErrorException(params.fallbackErrorMessage);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new InternalServerErrorException(params.fallbackErrorMessage);
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }

  private shouldRetryError(error: unknown): boolean {
    if (error instanceof SyntaxError) {
      return true;
    }

    if (error instanceof InternalServerErrorException) {
      return false;
    }

    if (error instanceof Error) {
      return error.name === 'AbortError' || error.name === 'TypeError';
    }

    return false;
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

    throw new InternalServerErrorException(
      'OpenAI 응답에서 텍스트 결과를 찾을 수 없습니다.',
    );
  }

  private parseJson(outputText: string): unknown {
    try {
      return JSON.parse(outputText);
    } catch {
      throw new SyntaxError('OpenAI response is not valid JSON.');
    }
  }

  private parseNicknameResponse(outputText: string): GeneratedNickname {
    const parsed = this.parseJson(outputText) as Partial<GeneratedNickname>;
    const nickname =
      typeof parsed.nickname === 'string' ? parsed.nickname.trim() : '';
    const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';

    if (!nickname || !reason) {
      throw new InternalServerErrorException(
        'OpenAI가 닉네임 또는 설명을 비워서 반환했습니다.',
      );
    }

    return { nickname, reason };
  }

  private parseMessageAdviceResponse(
    outputText: string,
  ): GeneratedMessageAdvice {
    const parsed = this.parseJson(outputText) as Partial<GeneratedMessageAdvice>;
    const riskLevel =
      parsed.riskLevel === 'medium' || parsed.riskLevel === 'high'
        ? parsed.riskLevel
        : 'low';

    return {
      riskLevel,
      shouldBlock: parsed.shouldBlock === true,
      warning:
        typeof parsed.warning === 'string' && parsed.warning.trim().length > 0
          ? parsed.warning.trim()
          : '이 표현은 상대에게 강하게 들릴 수 있어요.',
      suggestedRewrite:
        typeof parsed.suggestedRewrite === 'string' &&
        parsed.suggestedRewrite.trim().length > 0
          ? parsed.suggestedRewrite.trim()
          : null,
    };
  }

  private parseInterventionAdviceResponse(
    outputText: string,
  ): GeneratedInterventionAdvice {
    const parsed =
      this.parseJson(outputText) as Partial<GeneratedInterventionAdvice>;
    const interventionType =
      parsed.interventionType === 'participation' ||
      parsed.interventionType === 'deep_question' ||
      parsed.interventionType === 'stalled_discussion'
        ? parsed.interventionType
        : 'none';

    return {
      interventionNeeded: parsed.interventionNeeded === true,
      interventionType,
      reason:
        typeof parsed.reason === 'string' && parsed.reason.trim().length > 0
          ? parsed.reason.trim()
          : '대화 흐름을 넓힐 여지가 있어요.',
      suggestedMessage:
        typeof parsed.suggestedMessage === 'string' &&
        parsed.suggestedMessage.trim().length > 0
          ? parsed.suggestedMessage.trim()
          : null,
    };
  }

  private parseContributionAnalysisResponse(
    outputText: string,
  ): GeneratedContributionAnalysis {
    const parsed =
      this.parseJson(outputText) as Partial<GeneratedContributionAnalysis>;
    const allowedTypes = new Set([
      'initiator',
      'idea_provider',
      'questioner',
      'summarizer',
      'facilitator',
      'executor',
    ]);
    const seenNicknames = new Set<string>();
    const members = Array.isArray(parsed.members)
      ? parsed.members
          .map((member) => {
            const nickname =
              typeof member?.nickname === 'string' ? member.nickname.trim() : '';
            const contributionTypes = Array.isArray(member?.contributionTypes)
              ? [
                  ...new Set(
                    member.contributionTypes.filter(
                      (type): type is
                        | 'initiator'
                        | 'idea_provider'
                        | 'questioner'
                        | 'summarizer'
                        | 'facilitator'
                        | 'executor' => allowedTypes.has(type),
                    ),
                  ),
                ].slice(0, 2)
              : [];

            return {
              nickname,
              contributionScore:
                typeof member?.contributionScore === 'number'
                  ? Math.max(0, Math.min(100, Math.round(member.contributionScore)))
                  : 0,
              contributionTypes,
              reason:
                typeof member?.reason === 'string' && member.reason.trim().length > 0
                  ? member.reason.trim()
                  : '최근 대화에서 뚜렷한 기여 근거가 적었습니다. 더 많은 발화와 역할 참여가 필요합니다.',
            };
          })
          .filter((member) => {
            if (!member.nickname || seenNicknames.has(member.nickname)) {
              return false;
            }

            seenNicknames.add(member.nickname);
            return true;
          })
      : [];

    return {
      summary:
        typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
          ? parsed.summary.trim()
          : '최근 대화를 기준으로 역할과 참여 흐름을 분석했습니다.',
      members,
    };
  }
}
