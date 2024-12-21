import * as Console from 'node:console';
import { type Context, Hono } from 'hono';
import type { LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { run } from '../../../application/use-cases/list-home-condition-use-case';

type Bindings = {
  event?: LambdaEvent & {
    httpMethod?: string;
    path?: string;
  };
  lambdaContext?: LambdaContext;
};

export type AppContext = Context<{
  Bindings: Bindings;
  Variables: {
    session_key_rotation: boolean;
  };
}>;

const app = new Hono<{
  Bindings: Bindings;
  Variables: {
    session_key_rotation: boolean;
  };
}>();

app.use('*', cors());

app.get('/home-condition', async (c: AppContext) => {
  const since = c.req.query('since');
  const until = c.req.query('until');

  Console.log(`query: ${since}, ${until}`);

  if (!since || !until) {
    return c.json(
      { error: 'Missing required query parameters: since, until' },
      400
    );
  }
  const homeConditions = await run(since, until);

  return c.json(
    {
      homeConditions: homeConditions,
    },
    200
  );
});

export const handler = handle(app);
