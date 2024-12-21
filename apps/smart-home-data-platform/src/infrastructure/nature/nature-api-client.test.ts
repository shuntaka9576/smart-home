import { describe, expect, vi } from 'vitest';
import { fetchHomeCondition } from './nature-api-client';

global.fetch = vi.fn();
type Mock = ReturnType<typeof vi.fn>;

describe('fetchHomeCondition', () => {
  const mockDevicesResponse = [
    {
      name: 'Remo',
      id: 'db402149-881e-40fd-baaa-b8a5f03f1ad1',
      newest_events: {
        te: { val: 20, created_at: '2024-12-13T06:04:17Z' },
        hu: { val: 64, created_at: '2024-12-13T05:48:15Z' },
        il: { val: 0, created_at: '2024-12-13T05:45:24Z' },
      },
    },
  ];

  const mockAppliancesResponse = [
    {
      id: 'eaa24316-2575-484e-9d0f-f965deadee3b',
      device: {
        name: 'Remo',
        id: 'db402149-881e-40fd-baaa-b8a5f03f1ad1',
      },
      type: 'AC',
      settings: {
        temp: '24.5',
        temp_unit: 'c',
        mode: 'warm',
        vol: 'auto',
        dir: '1',
        dirh: 'still',
        button: 'power-off',
        updated_at: '2024-12-13T06:26:25Z',
      },
    },
    {
      id: '79b8e47a-2551-4362-9eba-012bbee9133e',
      device: {
        name: 'Remo E lite',
        id: 'b1c6bd16-caaa-4f64-9228-a23d0aa03305',
        created_at: '2024-12-12T00:24:12Z',
        updated_at: '2024-12-12T00:24:37Z',
        mac_address: 'f4:cf:a2:83:0b:24',
        bt_mac_address: 'f4:cf:a2:83:0b:26',
        serial_number: '4W120040000855',
        firmware_version: 'Remo-E-lite/1.10.0',
        temperature_offset: 0,
        humidity_offset: 0,
      },
      smart_meter: {
        echonetlite_properties: [
          {
            name: 'coefficient',
            epc: 211,
            val: '1',
            updated_at: '2024-12-13T06:09:56Z',
          },
          {
            name: 'cumulative_electric_energy_effective_digits',
            epc: 215,
            val: '6',
            updated_at: '2024-12-13T06:09:56Z',
          },
          {
            name: 'normal_direction_cumulative_electric_energy',
            epc: 224,
            val: '91507',
            updated_at: '2024-12-13T06:09:56Z',
          },
          {
            name: 'cumulative_electric_energy_unit',
            epc: 225,
            val: '1',
            updated_at: '2024-12-13T06:09:56Z',
          },
          {
            name: 'reverse_direction_cumulative_electric_energy',
            epc: 227,
            val: '13',
            updated_at: '2024-12-13T06:09:56Z',
          },
          {
            name: 'measured_instantaneous',
            epc: 231,
            val: '1715',
            updated_at: '2024-12-13T06:12:55Z',
          },
        ],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mock('../../utils/config', () => ({
      config: {
        NATURE_API_TOKEN: 'test-token',
        REMO_DEVICE_ID: 'db402149-881e-40fd-baaa-b8a5f03f1ad1',
        AC_APPLIANCE_ID: 'eaa24316-2575-484e-9d0f-f965deadee3b',
        SMART_METER_APPLIANCE_ID: '79b8e47a-2551-4362-9eba-012bbee9133e',
      },
    }));
  });

  test('should successfully fetch environmental state', async () => {
    (fetch as Mock).mockImplementation((url) => {
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDevicesResponse),
        });
      }
      if (url.includes('/appliances')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAppliancesResponse),
        });
      }
      throw new Error('Unexpected URL');
    });

    const result = await fetchHomeCondition();

    expect(result).toEqual({
      acStatus: 'off',
      environmentCondition: {
        temperature: {
          val: 20,
          createdAt: '2024-12-13T06:04:17Z',
        },
        humidity: {
          val: 64,
          createdAt: '2024-12-13T05:48:15Z',
        },
        illuminance: {
          val: 0,
          createdAt: '2024-12-13T05:45:24Z',
        },
      },
      smartMeterEchonetLiteCondition: {
        coefficient: {
          epc: 211,
          updatedAt: '2024-12-13T06:09:56Z',
          val: '1',
        },
        cumulativeElectricEnergyEffectiveDigits: {
          epc: 215,
          updatedAt: '2024-12-13T06:09:56Z',
          val: '6',
        },
        cumulativeElectricEnergyUnit: {
          epc: 225,
          updatedAt: '2024-12-13T06:09:56Z',
          val: '1',
        },
        measuredInstantaneous: {
          epc: 231,
          updatedAt: '2024-12-13T06:12:55Z',
          val: '1715',
        },
        normalDirectionCumulativeElectricEnergy: {
          epc: 224,
          updatedAt: '2024-12-13T06:09:56Z',
          val: '91507',
        },
        reverseDirectionCumulativeElectricEnergy: {
          epc: 227,
          updatedAt: '2024-12-13T06:09:56Z',
          val: '13',
        },
      },
    });
  });
});
