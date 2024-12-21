import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import type {
  ElectricEnergyData,
  ElectricEnergyEchonetLiteData,
  HomeCondition,
  HomeConditionForUser,
} from '../entities/home';

const CUMULATIVE_ELECTRIC_ENERGY_INITIAL_VALUE = 9156.3;

export const convertSmartMeterCondition = (
  smartMeterEchonetLiteCondition: ElectricEnergyEchonetLiteData
): ElectricEnergyData => {
  const cumulativeElectricEnergy = {
    val:
      convertKWHScaleFactorFromUnitCode(
        smartMeterEchonetLiteCondition.cumulativeElectricEnergyUnit.val
      ) *
      Number(
        smartMeterEchonetLiteCondition.normalDirectionCumulativeElectricEnergy
          .val
      ),
    updatedAt: DateTime.fromISO(
      smartMeterEchonetLiteCondition.normalDirectionCumulativeElectricEnergy
        .updatedAt,
      { zone: 'utc' }
    ).toMillis(),
  };
  const measuredInstantaneous = {
    val: Number(smartMeterEchonetLiteCondition.measuredInstantaneous.val),
    updatedAt: DateTime.fromISO(
      smartMeterEchonetLiteCondition.measuredInstantaneous.updatedAt,
      { zone: 'utc' }
    ).toMillis(),
  };

  return {
    cumulativeElectricEnergy,
    measuredInstantaneous,
  };
};

const convertKWHScaleFactorFromUnitCode = (val: string): number => {
  const num = Number.parseInt(val, 10);

  switch (num) {
    case 0x00:
      return 1;
    case 0x01:
      return 0.1;
    case 0x02:
      return 0.01;
    case 0x03:
      return 0.001;
    case 0x04:
      return 0.0001;
    case 0x0a:
      return 10;
    case 0x0b:
      return 100;
    case 0x0c:
      return 1000;
    case 0x0d:
      return 10000;
    default:
      throw new Error(`invalid unit val: ${val}`);
  }
};

// FIXME: jsの浮動小数点丸め誤差
export const convertToHomeConditionForUser = (
  conditions: HomeCondition[]
): HomeConditionForUser[] => {
  return conditions.map((condition, index) => {
    let delta: Decimal;

    if (index === 0) {
      delta = new Decimal(condition.cumulativeElectricEnergy).minus(
        new Decimal(CUMULATIVE_ELECTRIC_ENERGY_INITIAL_VALUE)
      );
    } else {
      delta = new Decimal(condition.cumulativeElectricEnergy).minus(
        new Decimal(conditions[index - 1].cumulativeElectricEnergy)
      );
    }
    delta = delta.toDecimalPlaces(2);

    // JSTへの変換処理
    const createdAtJST = DateTime.fromJSDate(condition.createdAt, {
      zone: 'utc',
    })
      .setZone('Asia/Tokyo')
      .toISO();
    const updatedAtJST = DateTime.fromJSDate(condition.updatedAt, {
      zone: 'utc',
    })
      .setZone('Asia/Tokyo')
      .toISO();

    if (createdAtJST == null || updatedAtJST == null) {
      throw new Error('invalid time error');
    }

    return {
      ...condition,
      createdAt: createdAtJST,
      updatedAt: updatedAtJST,
      cumulativeElectricEnergy: new Decimal(condition.cumulativeElectricEnergy)
        .toDecimalPlaces(2)
        .toNumber(),
      electricEnergyDelta: delta.toNumber(),
    };
  });
};
