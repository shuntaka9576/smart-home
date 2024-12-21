import { DateTime } from 'luxon';
import { list } from '../../infrastructure/home-condition-repository';
import { run } from './list-home-condition-use-case';

type Mock = ReturnType<typeof vi.fn>;

vi.mock('../../infrastructure/home-condition-repository', () => ({
  list: vi.fn(),
}));

describe('test use case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should call list with correct arguments and return empty array', async () => {
    const formatDateTime24Hour = 'yyyy-MM-dd HH:mm';
    const since = '2024-12-13 00:00';
    const until = '2024-12-14 00:00';

    const sinceDateTime = DateTime.fromFormat(since, formatDateTime24Hour, {
      zone: 'Asia/Tokyo',
    });
    const untilDateTime = DateTime.fromFormat(until, formatDateTime24Hour, {
      zone: 'Asia/Tokyo',
    });

    const mockData = [
      {
        cumulativeElectricEnergy: 11000.1,
        measuredInstantaneous: 10,
        temperature: 25,
        humidity: 40,
        illuminance: 500,
        acStatus: true,
        createdAt: DateTime.fromFormat(
          '2024-12-14 15:30',
          formatDateTime24Hour
        ).toJSDate(),
        updatedAt: DateTime.fromFormat(
          '2024-12-14 15:30',
          formatDateTime24Hour
        ).toJSDate(),
      },
      {
        cumulativeElectricEnergy: 11100.2,
        measuredInstantaneous: 15,
        temperature: 26,
        humidity: 42,
        illuminance: 520,
        acStatus: false,
        createdAt: DateTime.fromFormat(
          '2024-12-14 16:30',
          formatDateTime24Hour
        ).toJSDate(),
        updatedAt: DateTime.fromFormat(
          '2024-12-14 16:30',
          formatDateTime24Hour
        ).toJSDate(),
      },
      {
        cumulativeElectricEnergy: 11200.3,
        measuredInstantaneous: 20,
        temperature: 27,
        humidity: 45,
        illuminance: 550,
        acStatus: true,
        createdAt: DateTime.fromFormat(
          '2024-12-14 17:30',
          formatDateTime24Hour
        ).toJSDate(),
        updatedAt: DateTime.fromFormat(
          '2024-12-14 17:30',
          formatDateTime24Hour
        ).toJSDate(),
      },
    ];

    (list as Mock).mockResolvedValue(mockData);

    const result = await run(since, until);

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith(sinceDateTime, untilDateTime);

    expect(result).toEqual([
      {
        acStatus: true,
        createdAt: '2024-12-14T15:30:00.000+09:00',
        cumulativeElectricEnergy: 11000.1,
        electricEnergyDelta: 1843.8,
        humidity: 40,
        illuminance: 500,
        measuredInstantaneous: 10,
        temperature: 25,
        updatedAt: '2024-12-14T15:30:00.000+09:00',
      },
      {
        acStatus: false,
        createdAt: '2024-12-14T16:30:00.000+09:00',
        cumulativeElectricEnergy: 11100.2,
        electricEnergyDelta: 100.1,
        humidity: 42,
        illuminance: 520,
        measuredInstantaneous: 15,
        temperature: 26,
        updatedAt: '2024-12-14T16:30:00.000+09:00',
      },
      {
        acStatus: true,
        createdAt: '2024-12-14T17:30:00.000+09:00',
        cumulativeElectricEnergy: 11200.3,
        electricEnergyDelta: 100.1,
        humidity: 45,
        illuminance: 550,
        measuredInstantaneous: 20,
        temperature: 27,
        updatedAt: '2024-12-14T17:30:00.000+09:00',
      },
    ]);
  });
});
