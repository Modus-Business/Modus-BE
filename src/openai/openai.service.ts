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
                  'reason은 마침표 없이 40자 이내 한 문장으로 작성하라.',
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

  async generateMessageAdvice(params: {
    content: string;
    recentMessages: string[];
  }): Promise<GeneratedMessageAdvice> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY가 설정되지 않아 메시지 조언을 생성할 수 없습니다.',
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
                  '너는 학생 협업 서비스의 전송 전 문장 조언기다.',
                  '입력 문장이 상대에게 상처를 줄 가능성을 판단하고, 필요하면 부드러운 수정 제안을 해라.',
                  '정책 위반 수준이 아니라면 무조건 차단하지 말고 수정 제안을 우선하라.',
                  '출력은 JSON 객체 하나만 반환하라.',
                  '형식은 {"riskLevel":"low|medium|high","shouldBlock":boolean,"warning":"...","suggestedRewrite":"..."|null} 이다.',
                  'warning은 마침표 없이 40자 이내 한 문장으로 작성하라.',
                  'suggestedRewrite는 원래 의미를 유지하되 40자 이내 한 문장으로 제안하라.',
                  '문제가 거의 없으면 shouldBlock=false, riskLevel=low, suggestedRewrite=null 로 반환하라.',
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
                    content: params.content,
                    recentMessages: params.recentMessages,
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
          'OpenAI 응답 생성에 실패해 메시지 조언을 만들 수 없습니다.',
      );
    }

    return this.parseMessageAdviceResponse(this.extractOutputText(data).trim());
  }

  async generateInterventionAdvice(params: {
    recentMessages: string[];
    participantMessageCounts: Record<string, number>;
  }): Promise<GeneratedInterventionAdvice> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY가 설정되지 않아 대화 개입 조언을 생성할 수 없습니다.',
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
                  '너는 학생 협업 서비스의 그룹 대화 퍼실리테이터다.',
                  '최근 대화를 분석해 참여를 넓히거나 논의를 더 깊게 만들 개입이 필요한지 판단하라.',
                  '특정 사용자를 공개적으로 소외되었다고 지목하지 마라.',
                  '개입이 필요하면 전체 그룹에게 자연스럽게 던질 짧은 한국어 메시지 한 문장을 제안하라.',
                  '출력은 JSON 객체 하나만 반환하라.',
                  '형식은 {"interventionNeeded":boolean,"interventionType":"none|participation|deep_question|stalled_discussion","reason":"...","suggestedMessage":"..."|null} 이다.',
                  'reason은 마침표 없이 40자 이내 한 문장으로 작성하라.',
                  'suggestedMessage는 마침표 없이 40자 이내 한 문장으로 작성하라.',
                  '대화가 충분히 건강하고 활발하면 interventionNeeded=false, interventionType="none", suggestedMessage=null 로 반환하라.',
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
                    recentMessages: params.recentMessages,
                    participantMessageCounts: params.participantMessageCounts,
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
          'OpenAI 응답 생성에 실패해 대화 개입 조언을 만들 수 없습니다.',
      );
    }

    return this.parseInterventionAdviceResponse(
      this.extractOutputText(data).trim(),
    );
  }

  async generateContributionAnalysis(params: {
    recentMessages: string[];
    participantMessageCounts: Record<string, number>;
  }): Promise<GeneratedContributionAnalysis> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY가 설정되지 않아 기여도 분석을 생성할 수 없습니다.',
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
                  '너는 학생 협업 서비스의 기여도 분석 보조기다.',
                  '점수 대신 역할 기반으로 최근 대화를 분석하라.',
                  '허용 역할은 initiator, idea_provider, questioner, summarizer, facilitator, executor 만 사용하라.',
                  '메시지 개수만으로 높게 평가하지 말고 행동 기반으로만 판단하라.',
                  '성격 추정, 능력 평가, 도덕 판단은 금지한다.',
                  '출력은 JSON 객체 하나만 반환하라.',
                  '형식은 {"summary":"...","members":[{"nickname":"...","contributionScore":0,"contributionTypes":["..."],"reason":"..."}]} 이다.',
                  'summary는 마침표 없이 40자 이내 한 문장으로 작성하라.',
                  '각 reason도 마침표 없이 40자 이내 한 문장으로 작성하라.',
                  'contributionTypes는 1개 이상 2개 이하로 제한하라.',
                  'contributionScore는 0~100 정수로 반환하라.',
                  '점수는 메시지 수만이 아니라 역할의 질과 실제 기여를 함께 반영하라.',
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
                    recentMessages: params.recentMessages,
                    participantMessageCounts: params.participantMessageCounts,
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
          'OpenAI 응답 생성에 실패해 기여도 분석을 만들 수 없습니다.',
      );
    }

    return this.parseContributionAnalysisResponse(
      this.extractOutputText(data).trim(),
    );
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

  private parseMessageAdviceResponse(
    outputText: string,
  ): GeneratedMessageAdvice {
    try {
      const parsed = JSON.parse(outputText) as Partial<GeneratedMessageAdvice>;
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
            : '이 문장은 상대에게 다소 강하게 들릴 수 있어요.',
        suggestedRewrite:
          typeof parsed.suggestedRewrite === 'string' &&
          parsed.suggestedRewrite.trim().length > 0
            ? parsed.suggestedRewrite.trim()
            : null,
      };
    } catch {
      throw new InternalServerErrorException(
        'OpenAI 메시지 조언 응답을 JSON으로 해석하지 못했습니다.',
      );
    }
  }

  private parseInterventionAdviceResponse(
    outputText: string,
  ): GeneratedInterventionAdvice {
    try {
      const parsed = JSON.parse(outputText) as Partial<GeneratedInterventionAdvice>;
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
            : '현재 대화 흐름을 한 번 더 살펴볼 필요가 있어요.',
        suggestedMessage:
          typeof parsed.suggestedMessage === 'string' &&
          parsed.suggestedMessage.trim().length > 0
            ? parsed.suggestedMessage.trim()
            : null,
      };
    } catch {
      throw new InternalServerErrorException(
        'OpenAI 대화 개입 응답을 JSON으로 해석하지 못했습니다.',
      );
    }
  }

  private parseContributionAnalysisResponse(
    outputText: string,
  ): GeneratedContributionAnalysis {
    try {
      const parsed = JSON.parse(outputText) as Partial<GeneratedContributionAnalysis>;
      const allowedTypes = new Set([
        'initiator',
        'idea_provider',
        'questioner',
        'summarizer',
        'facilitator',
        'executor',
      ]);

      return {
        summary:
          typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
            ? parsed.summary.trim()
            : '대화 기여를 역할 기준으로 정리했어요',
        members: Array.isArray(parsed.members)
          ? parsed.members
              .map((member) => ({
                nickname:
                  typeof member?.nickname === 'string' ? member.nickname.trim() : '',
                contributionScore:
                  typeof member?.contributionScore === 'number'
                    ? Math.max(0, Math.min(100, Math.round(member.contributionScore)))
                    : 0,
                contributionTypes: Array.isArray(member?.contributionTypes)
                  ? member.contributionTypes.filter((type): type is
                      | 'initiator'
                      | 'idea_provider'
                      | 'questioner'
                      | 'summarizer'
                      | 'facilitator'
                      | 'executor' => allowedTypes.has(type))
                  : [],
                reason:
                  typeof member?.reason === 'string' ? member.reason.trim() : '',
              }))
              .filter(
                (member) =>
                  member.nickname.length > 0 && member.contributionTypes.length > 0,
              )
          : [],
      };
    } catch {
      throw new InternalServerErrorException(
        'OpenAI 기여도 분석 응답을 JSON으로 해석하지 못했습니다.',
      );
    }
  }
}
