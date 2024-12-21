import { convertSmartMeterCondition } from '../../domain/service/smart-meter-echonet-calculator';
import * as HomeConditionRepository from '../../infrastructure/home-condition-repository';
import { fetchHomeCondition } from '../../infrastructure/nature/nature-api-client';

export const run = async (): Promise<void> => {
  const homeConditionRaw = await fetchHomeCondition();
  const smartMeterCondition = convertSmartMeterCondition(
    homeConditionRaw.smartMeterEchonetLiteCondition
  );

  await HomeConditionRepository.create({
    cumulativeElectricEnergy: smartMeterCondition.cumulativeElectricEnergy.val,
    measuredInstantaneous: smartMeterCondition.measuredInstantaneous.val,
    temperature: homeConditionRaw.environmentCondition.temperature.val,
    humidity: homeConditionRaw.environmentCondition.humidity.val,
    illuminance: homeConditionRaw.environmentCondition.illuminance.val,
    acStatus: homeConditionRaw.acStatus === 'on',
  });
};
