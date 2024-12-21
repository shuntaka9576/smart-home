import { DateTime } from 'luxon';
import { convertToHomeConditionForUser } from '../../domain/service/smart-meter-echonet-calculator';
import { list } from '../../infrastructure/home-condition-repository';

export const run = async (since: string, until: string) => {
  const formatDateTime24Hour = 'yyyy-MM-dd HH:mm';

  const sinceDateTime = DateTime.fromFormat(since, formatDateTime24Hour, {
    zone: 'Asia/Tokyo',
  });
  const untilDateTime = DateTime.fromFormat(until, formatDateTime24Hour, {
    zone: 'Asia/Tokyo',
  });

  const homeConditionList = await list(sinceDateTime, untilDateTime);
  return convertToHomeConditionForUser(homeConditionList);
};
