export type HomeConditionRaw = {
  environmentCondition: HomeSensorData;
  acStatus: ACStatus;
  smartMeterEchonetLiteCondition: ElectricEnergyEchonetLiteData;
};

export type HomeCondition = {
  cumulativeElectricEnergy: number;
  measuredInstantaneous: number;
  temperature: number;
  humidity: number;
  illuminance: number;
  acStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HomeConditionForUser = {
  measuredInstantaneous: number;
  temperature: number;
  humidity: number;
  illuminance: number;
  acStatus: boolean;
  electricEnergyDelta: number;
  createdAt: string;
  updatedAt: string;
};

export type HomeSensorData = {
  temperature: {
    val: number;
    createdAt: string;
  };
  humidity: {
    val: number;
    createdAt: string;
  };
  illuminance: {
    val: number;
    createdAt: string;
  };
};

export type ACStatus = 'off' | 'on';

export type ElectricEnergyEchonetLiteData = {
  // 係数
  coefficient: {
    epc: number;
    val: string;
    updatedAt: string;
  };
  // 積算電力量計測値(正方向)
  // 買電(電力会社から電気を買う)
  normalDirectionCumulativeElectricEnergy: {
    epc: number;
    val: string;
    updatedAt: string;
  };
  // 積算電力量計測値(逆方向)
  // 売電(電力会社へ電気を得る)
  reverseDirectionCumulativeElectricEnergy: {
    epc: number;
    val: string;
    updatedAt: string;
  };
  // 積算電力量有効桁数
  cumulativeElectricEnergyEffectiveDigits: {
    epc: number;
    val: string;
    updatedAt: string;
  };
  // 積算電力量単位
  cumulativeElectricEnergyUnit: {
    epc: number;
    val: string;
    updatedAt: string;
  };
  // 瞬時電力計測値
  measuredInstantaneous: {
    epc: number;
    val: string;
    updatedAt: string;
  };
};

export type ElectricEnergyData = {
  cumulativeElectricEnergy: {
    val: number; // kWh
    updatedAt: number;
  };
  measuredInstantaneous: {
    val: number; // w
    updatedAt: number;
  };
};
