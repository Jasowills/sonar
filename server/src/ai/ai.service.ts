import { Injectable } from '@nestjs/common';

interface CacheEntry {
  data: string;
  expiresAt: number;
}

@Injectable()
export class AiService {
  private cache = new Map<string, CacheEntry>();
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly MAX_RPM = 20;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  async generate(
    prompt: string,
    options?: { cacheKey?: string; temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const cacheKey = options?.cacheKey;

    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    await this.ensureRateLimit();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[AiService] OPENROUTER_API_KEY environment variable is not set');
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sonar.app',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: [
              'You are Sonar AI, an observability assistant for developers.',
              'You analyze monitoring data, errors, deployments, and user sessions.',
              'Be concise, specific, and actionable. Avoid generic advice.',
              'When asked for JSON, respond with valid JSON only, no markdown fences.',
            ].join(' '),
          },
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AiService] OpenRouter error ${response.status}: ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content ?? '';

    if (cacheKey && text) {
      this.cache.set(cacheKey, { data: text, expiresAt: Date.now() + this.CACHE_TTL_MS });
    }

    return text;
  }

  async generateJson<T>(
    prompt: string,
    options?: { cacheKey?: string; temperature?: number; maxTokens?: number },
  ): Promise<T | null> {
    try {
      let text = await this.generate(prompt, {
        ...options,
        temperature: options?.temperature ?? 0.3,
      });
      text = text.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '').trim();
      return JSON.parse(text) as T;
    } catch (err) {
      console.error('[AiService] generateJson error:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  private async ensureRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastResetTime > 60_000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    if (this.requestCount >= this.MAX_RPM) {
      const waitMs = 60_000 - (now - this.lastResetTime);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }
    this.requestCount++;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
