import { create } from '../../infrastructure/home-condition-repository';
import { fetchHomeCondition } from '../../infrastructure/nature/nature-api-client';
import { run } from './store-home-condition-use-case';

type Mock = ReturnType<typeof vi.fn>;
vi.mock('../../infrastructure/nature/nature-api-client', () => ({
  fetchHomeCondition: vi.fn(),
}));
vi.mock('../../infrastructure/home-condition-repository', () => ({
  create: vi.fn(),
}));

describe('test use case', () => {
  test('run', async () => {
    const mockResponse = {
      environmentCondition: {
        temperature: { val: 22, created_at: '2024-12-13T18:00:28Z' },
        humidity: { val: 59, createdAt: '2024-12-13T17:56:28Z' },
        illuminance: { val: 0, createdAt: '2024-12-13T17:58:27Z' },
      },
      acStatus: 'on',
      smartMeterEchonetLiteCondition: {
        coefficient: {
          name: 'coefficient',
          epc: 211,
          val: '1',
          updated_at: '2024-12-13T17:59:56Z',
        },
        normalDirectionCumulativeElectricEnergy: {
          name: 'normal_direction_cumulative_electric_energy',
          epc: 224,
          val: '91547',
          updated_at: '2024-12-13T17:59:56Z',
        },
        reverseDirectionCumulativeElectricEnergy: {
          name: 'reverse_direction_cumulative_electric_energy',
          epc: 227,
          val: '13',
          updated_at: '2024-12-13T17:59:56Z',
        },
        cumulativeElectricEnergyEffectiveDigits: {
          name: 'cumulative_electric_energy_effective_digits',
          epc: 215,
          val: '6',
          updated_at: '2024-12-13T17:59:56Z',
        },
        cumulativeElectricEnergyUnit: {
          name: 'cumulative_electric_energy_unit',
          epc: 225,
          val: '1',
          updated_at: '2024-12-13T17:59:56Z',
        },
        measuredInstantaneous: {
          name: 'measured_instantaneous',
          epc: 231,
          val: '745',
          updated_at: '2024-12-13T18:03:55Z',
        },
      },
    };
    (fetchHomeCondition as Mock).mockResolvedValue(mockResponse);
    (create as Mock).mockResolvedValue({});

    await run();

    expect(fetchHomeCondition).toHaveBeenCalledTimes(1);
    expect(fetchHomeCondition).toHaveBeenCalledWith();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      acStatus: true,
      cumulativeElectricEnergy: 9154.7,
      humidity: 59,
      illuminance: 0,
      measuredInstantaneous: 745,
      temperature: 22,
    });
  });
});
