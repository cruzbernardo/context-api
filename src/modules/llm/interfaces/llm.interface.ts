import { PropertyType } from 'src/modules/properties/enums';

export interface LlmAnalysisResult {
  nearSubway?: boolean;
  needsRenovation?: boolean;
  estimatedCapacityPeople: number;
  recommendedUse?: PropertyType;
}

export interface LlmFilterResult {
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  nearSubway?: boolean;
  needsRenovation?: boolean;
  recommendedUse?: PropertyType;
  estimatedCapacityPeople?: number;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {
  model: string;
  messages: GroqMessage[];
  response_format?: {
    type: 'json_object';
  };
  temperature?: number;
  max_tokens?: number;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
