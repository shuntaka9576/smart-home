import * as Console from 'node:console';
import { PrismaClient } from '@prisma/client';
import type { DateTime } from 'luxon';
import type { HomeCondition } from '../domain/entities/home';

const prisma = new PrismaClient();

type CreateHomeConditionParams = {
  cumulativeElectricEnergy: number;
  measuredInstantaneous: number;
  temperature: number;
  humidity: number;
  illuminance: number;
  acStatus: boolean;
};

export const create = async (params: CreateHomeConditionParams) => {
  const res = await prisma.homeCondition.create({
    data: params,
  });

  Console.log(`create home condition record: ${JSON.stringify(res)}`);
};

export const list = async (
  since: DateTime,
  until: DateTime
): Promise<HomeCondition[]> => {
  const records = await prisma.homeCondition.findMany({
    where: {
      createdAt: {
        gte: since.toJSDate(),
        lte: until.toJSDate(),
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return records;
};
