import type { HandlerEvent } from '@netlify/functions';
import { afterEach, describe, expect, it } from 'vitest';
import { handler } from '../../netlify/functions/submit-score';

const originalEnvironment = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

afterEach(() => {
  restoreEnvironment('SUPABASE_URL', originalEnvironment.SUPABASE_URL);
  restoreEnvironment('SUPABASE_SECRET_KEY', originalEnvironment.SUPABASE_SECRET_KEY);
  restoreEnvironment('SUPABASE_SERVICE_ROLE_KEY', originalEnvironment.SUPABASE_SERVICE_ROLE_KEY);
});

describe('leaderboard Netlify Function', () => {
  it('reports an unconfigured health state without exposing environment details', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await handler(event('GET'), {} as never);

    expect(response?.statusCode).toBe(503);
    expect(JSON.parse(response?.body ?? '')).toEqual({ configured: false, databaseReachable: false });
  });

  it('rejects malformed score submissions before contacting Supabase', async () => {
    const response = await handler(event('POST', '{}'), {} as never);

    expect(response?.statusCode).toBe(400);
    expect(JSON.parse(response?.body ?? '')).toEqual({ error: 'Invalid score submission.' });
  });
});

function event(httpMethod: string, body: string | null = null): HandlerEvent {
  return {
    rawUrl: 'https://limbotrials.netlify.app/api/leaderboard',
    rawQuery: '',
    path: '/api/leaderboard',
    httpMethod,
    headers: {
      origin: 'https://limbotrials.netlify.app',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body,
    isBase64Encoded: false,
  };
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
