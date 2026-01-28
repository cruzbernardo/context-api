import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'winston';
import {
  LlmAnalysisResult,
  GroqChatRequest,
  GroqChatResponse,
} from '../interfaces';
import {
  buildUserPrompt,
  buildNoteAnalysisSystemPrompt,
  buildFilterExtractionSystemPrompt,
} from '../prompts';
import { parsePropertyFeatureResponse } from 'src/shared/utils';

@Injectable()
export class LlmService {
  private readonly groqApiUrl =
    'https://api.groq.com/openai/v1/chat/completions';
  private readonly model: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,

    @Inject('winston')
    private readonly logger: Logger,
  ) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.model =
      this.configService.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
  }

  async analyzePropertyNote(noteText: string): Promise<LlmAnalysisResult> {
    this.logger.debug('Analyzing property note with LLM', {
      context: LlmService.name,
      noteTextLength: noteText.length,
    });

    try {
      const content = await this.callLlm({
        systemPrompt: buildNoteAnalysisSystemPrompt(),
        userPrompt: buildUserPrompt(noteText),
        maxTokens: 150,
      });

      const parsed = parsePropertyFeatureResponse(content);

      this.logger.info('Property note analyzed successfully', {
        context: LlmService.name,
        result: parsed,
      });

      return parsed;
    } catch (error) {
      this.logger.error('Failed to analyze property note', {
        context: LlmService.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async extractPropertyFiltersFromUserText(userText: string): Promise<string> {
    this.logger.debug('Extracting filters from user text', {
      context: LlmService.name,
      textLength: userText.length,
    });

    try {
      const content = await this.callLlm({
        systemPrompt: buildFilterExtractionSystemPrompt(),
        userPrompt: buildUserPrompt(userText),
        maxTokens: 300,
      });

      this.logger.info('Filters extracted successfully', {
        context: LlmService.name,
        result: content,
      });

      return content;
    } catch (error) {
      this.logger.error('Failed to extract filters', {
        context: LlmService.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async callLlm(params: {
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature?: number;
  }): Promise<string> {
    const { systemPrompt, userPrompt, maxTokens, temperature = 0 } = params;

    const request: GroqChatRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    };

    const response = await firstValueFrom(
      this.httpService.post<GroqChatResponse>(this.groqApiUrl, request, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    return content;
  }
}
