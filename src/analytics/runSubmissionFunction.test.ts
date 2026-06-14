import type { HandlerEvent } from '@netlify/functions';
import { afterEach, describe, expect, it } from 'vitest';
import { handler } from '../../netlify/functions/submit-run';
import { createDefaultSave } from '../game/systems/SaveSystem';
import { RunState } from '../game/systems/RunState';
import { createRunRecordSubmission } from './runSubmissionRules';

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

describe('run-recording Netlify Function', () => {
  it('reports an unconfigured health state without exposing environment details', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await handler(event('GET'), {} as never);

    expect(response?.statusCode).toBe(503);
    expect(JSON.parse(response?.body ?? '')).toEqual({ configured: false, databaseReachable: false });
  });

  it('rejects malformed run submissions before contacting Supabase', async () => {
    const response = await handler(event('POST', '{}'), {} as never);

    expect(response?.statusCode).toBe(400);
    expect(JSON.parse(response?.body ?? '')).toEqual({ error: 'Invalid run submission.' });
  });

  it('accepts a bounded full run record before checking server configuration', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const submission = createRunRecordSubmission(
      new RunState(createDefaultSave()).summary(false),
      'Veno 89',
      'c2c75283-aeee-49b8-96f2-b07a2c55a6b4',
    );

    const response = await handler(event('POST', JSON.stringify(submission)), {} as never);

    expect(response?.statusCode).toBe(503);
    expect(JSON.parse(response?.body ?? '')).toEqual({ error: 'Run recording service is not configured.' });
  });
});

function event(httpMethod: string, body: string | null = null): HandlerEvent {
  return {
    rawUrl: 'https://limbotrials.netlify.app/api/runs',
    rawQuery: '',
    path: '/api/runs',
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
