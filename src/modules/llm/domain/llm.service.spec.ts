import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { PropertyType } from 'src/modules/properties/enums';
import { GroqChatResponse } from '../interfaces';

describe('LlmService', () => {
  let service: LlmService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockGroqResponse: GroqChatResponse = {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: Date.now(),
    model: 'llama-3.3-70b-versatile',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({
            nearSubway: true,
            needsRenovation: false,
            estimatedCapacityPeople: 50,
            recommendedUse: 'office',
          }),
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  };

  const createAxiosResponse = (data: GroqChatResponse): AxiosResponse => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  beforeEach(async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'GROQ_API_KEY') return 'test-api-key';
      if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'winston',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    logger = module.get('winston');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with config values', () => {
      expect(configService.get).toHaveBeenCalledWith('GROQ_API_KEY');
      expect(configService.get).toHaveBeenCalledWith('GROQ_MODEL');
    });
  });

  describe('analyzePropertyNote', () => {
    const noteText =
      'Beautiful office space near subway station with natural lighting';

    it('should analyze a property note successfully', async () => {
      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(mockGroqResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(result).toEqual({
        nearSubway: true,
        needsRenovation: false,
        estimatedCapacityPeople: 50,
        recommendedUse: PropertyType.OFFICE,
      });
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(noteText),
            }),
          ]),
          response_format: { type: 'json_object' },
          temperature: 0,
          max_tokens: 150,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw error when LLM returns empty response', async () => {
      const emptyResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: '' },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(emptyResponse)),
      );

      await expect(service.analyzePropertyNote(noteText)).rejects.toThrow(
        'Empty response from LLM',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to analyze property note'),
        expect.any(Object),
      );
    });

    it('should throw error when LLM returns no choices', async () => {
      const noChoicesResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(noChoicesResponse)),
      );

      await expect(service.analyzePropertyNote(noteText)).rejects.toThrow();
    });

    it('should handle HTTP errors', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.analyzePropertyNote(noteText)).rejects.toThrow(
        'Network error',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to analyze property note'),
        expect.objectContaining({
          error: 'Network error',
        }),
      );
    });

    it('should handle JSON parse errors', async () => {
      const invalidJsonResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'not valid json' },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(invalidJsonResponse)),
      );

      await expect(service.analyzePropertyNote(noteText)).rejects.toThrow();
    });
  });

  describe('parseResponse (tested through analyzePropertyNote)', () => {
    const noteText = 'Test note';

    it('should handle warehouse property type', async () => {
      const warehouseResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                nearSubway: false,
                needsRenovation: true,
                estimatedCapacityPeople: 200,
                recommendedUse: 'warehouse',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(warehouseResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(result.recommendedUse).toBe(PropertyType.WAREHOUSE);
    });

    it('should handle retail property type', async () => {
      const retailResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                nearSubway: true,
                needsRenovation: false,
                estimatedCapacityPeople: 30,
                recommendedUse: 'retail',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(retailResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(result.recommendedUse).toBe(PropertyType.RETAIL);
    });

    it('should return undefined for invalid property type', async () => {
      const invalidTypeResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                nearSubway: true,
                needsRenovation: false,
                estimatedCapacityPeople: 50,
                recommendedUse: 'invalid_type',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(invalidTypeResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(result.recommendedUse).toBeUndefined();
    });

    it('should convert string booleans correctly', async () => {
      const stringBoolResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                nearSubway: 'true',
                needsRenovation: 'false',
                estimatedCapacityPeople: '50',
                recommendedUse: 'office',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(stringBoolResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(typeof result.nearSubway).toBe('boolean');
      expect(typeof result.needsRenovation).toBe('boolean');
      expect(typeof result.estimatedCapacityPeople).toBe('number');
    });

    it('should handle null/undefined estimatedCapacityPeople as 0', async () => {
      const nullCapacityResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                nearSubway: true,
                needsRenovation: false,
                estimatedCapacityPeople: null,
                recommendedUse: 'office',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(nullCapacityResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(result.estimatedCapacityPeople).toBe(0);
    });

    it('should handle uppercase property types', async () => {
      const uppercaseResponse: GroqChatResponse = {
        ...mockGroqResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                nearSubway: true,
                needsRenovation: false,
                estimatedCapacityPeople: 50,
                recommendedUse: 'OFFICE',
              }),
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(uppercaseResponse)),
      );

      const result = await service.analyzePropertyNote(noteText);

      expect(result.recommendedUse).toBe(PropertyType.OFFICE);
    });
  });

  describe('Configuration', () => {
    it('should use default model when GROQ_MODEL is not set', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return undefined;
        return null;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LlmService,
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: 'winston', useValue: mockLogger },
        ],
      }).compile();

      const newService = module.get<LlmService>(LlmService);
      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(mockGroqResponse)),
      );

      await newService.analyzePropertyNote('test');

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
        }),
        expect.any(Object),
      );
    });
  });

  describe('extractPropertyFiltersFromUserText', () => {
    const createFilterResponse = (filters: object): GroqChatResponse => ({
      id: 'chatcmpl-filter-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'llama-3.3-70b-versatile',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify(filters),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 80,
        total_tokens: 230,
      },
    });

    it('should extract city and neighborhood filters', async () => {
      const filterResponse = createFilterResponse({
        city: 'New York',
        neighborhood: 'Manhattan',
        propertyType: null,
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'I need a space in Manhattan, New York',
      );
      const parsed = JSON.parse(result);

      expect(parsed.city).toBe('New York');
      expect(parsed.neighborhood).toBe('Manhattan');
      expect(parsed.propertyType).toBeNull();
    });

    it('should extract property type filter', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: 'office',
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Looking for an office',
      );
      const parsed = JSON.parse(result);

      expect(parsed.propertyType).toBe('office');
    });

    it('should extract price range filters', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: null,
        minPrice: 100000,
        maxPrice: 500000,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Budget between 100k and 500k',
      );
      const parsed = JSON.parse(result);

      expect(parsed.minPrice).toBe(100000);
      expect(parsed.maxPrice).toBe(500000);
    });

    it('should extract area range filters', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: null,
        minPrice: null,
        maxPrice: null,
        minArea: 180,
        maxArea: 220,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Around 200 square meters',
      );
      const parsed = JSON.parse(result);

      expect(parsed.minArea).toBe(180);
      expect(parsed.maxArea).toBe(220);
    });

    it('should extract nearSubway filter', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: null,
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: true,
        needsRenovation: null,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Near subway station',
      );
      const parsed = JSON.parse(result);

      expect(parsed.nearSubway).toBe(true);
    });

    it('should extract needsRenovation filter', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: null,
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: false,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Ready to use, no renovation needed',
      );
      const parsed = JSON.parse(result);

      expect(parsed.needsRenovation).toBe(false);
    });

    it('should extract recommendedUse and estimatedCapacityPeople filters', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: null,
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: 'warehouse',
        estimatedCapacityPeople: 50,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Need a warehouse for 50 people',
      );
      const parsed = JSON.parse(result);

      expect(parsed.recommendedUse).toBe('warehouse');
      expect(parsed.estimatedCapacityPeople).toBe(50);
    });

    it('should extract multiple filters at once', async () => {
      const filterResponse = createFilterResponse({
        city: 'Chicago',
        neighborhood: 'Downtown',
        propertyType: 'retail',
        minPrice: null,
        maxPrice: 2000000,
        minArea: 500,
        maxArea: 1000,
        nearSubway: true,
        needsRenovation: false,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Looking for retail in Downtown Chicago, 500-1000 sqm, up to 2M, near subway',
      );
      const parsed = JSON.parse(result);

      expect(parsed.city).toBe('Chicago');
      expect(parsed.neighborhood).toBe('Downtown');
      expect(parsed.propertyType).toBe('retail');
      expect(parsed.maxPrice).toBe(2000000);
      expect(parsed.minArea).toBe(500);
      expect(parsed.maxArea).toBe(1000);
      expect(parsed.nearSubway).toBe(true);
    });

    it('should return raw JSON with null values for vague input', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: null,
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: null,
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'I need something nice',
      );
      const parsed = JSON.parse(result);

      expect(parsed.city).toBeNull();
      expect(parsed.propertyType).toBeNull();
    });

    it('should return raw property types as-is (no normalization)', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: 'WAREHOUSE',
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: 'RETAIL',
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText(
        'Warehouse recommended for retail',
      );
      const parsed = JSON.parse(result);

      expect(parsed.propertyType).toBe('WAREHOUSE');
      expect(parsed.recommendedUse).toBe('RETAIL');
    });

    it('should return raw values without validation', async () => {
      const filterResponse = createFilterResponse({
        city: null,
        neighborhood: null,
        propertyType: 'invalid_type',
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        nearSubway: null,
        needsRenovation: null,
        recommendedUse: 'also_invalid',
        estimatedCapacityPeople: null,
      });

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const result =
        await service.extractPropertyFiltersFromUserText('Some text');
      const parsed = JSON.parse(result);

      expect(parsed.propertyType).toBe('invalid_type');
      expect(parsed.recommendedUse).toBe('also_invalid');
    });

    it('should throw error when LLM returns empty response', async () => {
      const emptyResponse: GroqChatResponse = {
        ...createFilterResponse({}),
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: '' },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(emptyResponse)),
      );

      await expect(
        service.extractPropertyFiltersFromUserText('test'),
      ).rejects.toThrow('Empty response from LLM');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to extract filters'),
        expect.any(Object),
      );
    });

    it('should handle HTTP errors', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('API error')),
      );

      await expect(
        service.extractPropertyFiltersFromUserText('test'),
      ).rejects.toThrow('API error');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to extract filters'),
        expect.objectContaining({
          error: 'API error',
        }),
      );
    });

    it('should return raw string content (parsing done by caller)', async () => {
      const rawContent = 'not valid json';
      const invalidJsonResponse: GroqChatResponse = {
        ...createFilterResponse({}),
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: rawContent },
            finish_reason: 'stop',
          },
        ],
      };

      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(invalidJsonResponse)),
      );

      const result = await service.extractPropertyFiltersFromUserText('test');
      expect(result).toBe(rawContent);
    });

    it('should send correct request to API', async () => {
      const filterResponse = createFilterResponse({});
      mockHttpService.post.mockReturnValue(
        of(createAxiosResponse(filterResponse)),
      );

      const userText = 'Office near subway';
      await service.extractPropertyFiltersFromUserText(userText);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(userText),
            }),
          ]),
          response_format: { type: 'json_object' },
          temperature: 0,
          max_tokens: 300,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });
});
