import type {
  ACStatus,
  ElectricEnergyEchonetLiteData,
  HomeConditionRaw,
  HomeSensorData,
} from '../../domain/entities/home';
import { config } from '../../utils/config';

interface NatureDevice {
  name: string;
  id: string;
  newest_events?: {
    te?: { val: number; created_at: string };
    hu?: { val: number; created_at: string };
    il?: { val: number; created_at: string };
  };
}

interface NatureAppliance {
  id: string;
  device: {
    id: string;
    name: string;
  };
  type?: string;
  settings?: {
    button?: string;
  };
  smart_meter?: {
    echonetlite_properties: EchonetLiteProperty[];
  };
}

type EchonetLitePropertyName =
  | 'coefficient'
  | 'cumulative_electric_energy_effective_digits'
  | 'normal_direction_cumulative_electric_energy'
  | 'cumulative_electric_energy_unit'
  | 'reverse_direction_cumulative_electric_energy'
  | 'measured_instantaneous';

type EchonetLiteProperty = {
  name: EchonetLitePropertyName;
  epc: number;
  val: string;
  updated_at: string;
};

export const fetchHomeCondition = async (): Promise<HomeConditionRaw> => {
  const [devices, appliances] = await Promise.all([
    fetchDevices(),
    fetchAppliances(),
  ]);

  const smartMeterAppliance = appliances.filter(
    (ap) => ap.id === config.SMART_METER_APPLIANCE_ID
  )[0];
  const acAppliance = appliances.filter(
    (ap) => ap.id === config.AC_APPLIANCE_ID
  )[0];
  const remoDevice = devices.filter(
    (device) => device.id === config.REMO_DEVICE_ID
  )[0];

  const environmentCondition = retrievalEnvironmentCondition(remoDevice);
  const acStatus = retrievalACStatus(acAppliance);
  const smartMeterEchonetLiteCondition =
    retrievalSmartMeterEchonetLiteCondition(smartMeterAppliance);

  return {
    environmentCondition: environmentCondition,
    acStatus: acStatus,
    smartMeterEchonetLiteCondition,
  };
};

const fetchDevices = async (): Promise<NatureDevice[]> => {
  const res = await fetch('https://api.nature.global/1/devices', {
    headers: { Authorization: `Bearer ${config.NATURE_API_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch devices: ${res.status} ${res.statusText}`);
  }

  return await res.json();
};

const fetchAppliances = async (): Promise<NatureAppliance[]> => {
  const res = await fetch('https://api.nature.global/1/appliances', {
    headers: { Authorization: `Bearer ${config.NATURE_API_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch appliances: ${res.status} ${res.statusText}`
    );
  }

  return await res.json();
};

const retrievalEnvironmentCondition = (
  natureDevice: NatureDevice
): HomeSensorData => {
  const temperature = natureDevice.newest_events?.te;
  const humidity = natureDevice.newest_events?.hu;
  const illuminance = natureDevice.newest_events?.il;

  if (temperature == null || humidity == null || illuminance == null) {
    throw new Error(
      `unexpected remoAppliance data: ${JSON.stringify(natureDevice)}`
    );
  }

  return {
    temperature: {
      val: temperature.val,
      createdAt: temperature.created_at,
    },
    humidity: {
      val: humidity.val,
      createdAt: humidity.created_at,
    },
    illuminance: {
      val: illuminance.val,
      createdAt: illuminance.created_at,
    },
  };
};
const retrievalSmartMeterEchonetLiteCondition = (
  natureAppliance: NatureAppliance
): ElectricEnergyEchonetLiteData => {
  const propsArray = natureAppliance?.smart_meter?.echonetlite_properties;
  if (propsArray == null) {
    throw new Error();
  }

  const propsMap = new Map<EchonetLitePropertyName, EchonetLiteProperty>();

  for (const p of propsArray) {
    propsMap.set(p.name, p);
  }

  const coefficient = propsMap.get('coefficient');

  const cumulativeElectricEnergyEffectiveDigits = propsMap.get(
    'cumulative_electric_energy_effective_digits'
  );
  const normalDirectionCumulativeElectricEnergy = propsMap.get(
    'normal_direction_cumulative_electric_energy'
  );
  const cumulativeElectricEnergyUnit = propsMap.get(
    'cumulative_electric_energy_unit'
  );
  const reverseDirectionCumulativeElectricEnergy = propsMap.get(
    'reverse_direction_cumulative_electric_energy'
  );
  const measuredInstantaneous = propsMap.get('measured_instantaneous');
  if (
    !coefficient ||
    !cumulativeElectricEnergyEffectiveDigits ||
    !normalDirectionCumulativeElectricEnergy ||
    !cumulativeElectricEnergyUnit ||
    !reverseDirectionCumulativeElectricEnergy ||
    !measuredInstantaneous
  ) {
    throw new Error('Necessary property not found in the data.');
  }

  return {
    coefficient: {
      epc: coefficient.epc,
      val: coefficient.val,
      updatedAt: coefficient.updated_at,
    },
    cumulativeElectricEnergyEffectiveDigits: {
      epc: cumulativeElectricEnergyEffectiveDigits.epc,
      val: cumulativeElectricEnergyEffectiveDigits.val,
      updatedAt: cumulativeElectricEnergyEffectiveDigits.updated_at,
    },
    normalDirectionCumulativeElectricEnergy: {
      epc: normalDirectionCumulativeElectricEnergy.epc,
      val: normalDirectionCumulativeElectricEnergy.val,
      updatedAt: normalDirectionCumulativeElectricEnergy.updated_at,
    },
    cumulativeElectricEnergyUnit: {
      epc: cumulativeElectricEnergyUnit.epc,
      val: cumulativeElectricEnergyUnit.val,
      updatedAt: cumulativeElectricEnergyUnit.updated_at,
    },
    reverseDirectionCumulativeElectricEnergy: {
      epc: reverseDirectionCumulativeElectricEnergy.epc,
      val: reverseDirectionCumulativeElectricEnergy.val,
      updatedAt: reverseDirectionCumulativeElectricEnergy.updated_at,
    },
    measuredInstantaneous: {
      epc: measuredInstantaneous.epc,
      val: measuredInstantaneous.val,
      updatedAt: measuredInstantaneous.updated_at,
    },
  };
};

const retrievalACStatus = (natureAppliance: NatureAppliance): ACStatus => {
  return natureAppliance.settings?.button === 'power-off' ? 'off' : 'on';
};
