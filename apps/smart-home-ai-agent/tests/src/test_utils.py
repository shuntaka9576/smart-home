import datetime
import pytest
from freezegun import freeze_time
from src.utils import get_current_month_utc_range_and_days


@pytest.mark.parametrize(
    "freeze_datetime, expected_start_utc, expected_end_utc, expected_remaining_days, expected_current_month",
    [
        # テストケース1: 2024年4月15日10時JSTの場合
        # 月初JST: 2024-04-01T00:00:00+09:00 => UTC: 2024-03-31T15:00:00Z
        # 月末JST: 2024-05-01T00:00:00+09:00 => UTC: 2024-04-30T15:00:00Z
        # now_jst: 2024-04-15T10:00:00+09:00
        # 残り日数 = (2024-05-01 00:00 JST - 2024-04-15 10:00 JST)
        # ≒ 15日と14時間 → days属性は15
        (
            "2024-04-15T10:00:00+09:00",
            datetime.datetime(2024, 3, 31, 15, 0, 0, tzinfo=datetime.timezone.utc),
            datetime.datetime(2024, 4, 30, 15, 0, 0, tzinfo=datetime.timezone.utc),
            15,
            4,
        ),
        # テストケース2: 年末 2024年12月10日15時30分JST
        # 月初JST: 2024-12-01T00:00:00+09:00 => UTC: 2024-11-30T15:00:00Z
        # 月末JST: 2025-01-01T00:00:00+09:00 => UTC: 2024-12-31T15:00:00Z
        # now_jst: 2024-12-10T15:30:00+09:00
        # 残り日数 = (2025-01-01T00:00 JST - 2024-12-10T15:30 JST)
        # ≒21日と8.5時間 → days属性は21
        (
            "2024-12-10T15:30:00+09:00",
            datetime.datetime(2024, 11, 30, 15, 0, 0, tzinfo=datetime.timezone.utc),
            datetime.datetime(2024, 12, 31, 15, 0, 0, tzinfo=datetime.timezone.utc),
            21,
            12,
        ),
    ],
)
def test_get_current_month_utc_range_and_days(
    freeze_datetime,
    expected_start_utc,
    expected_end_utc,
    expected_remaining_days,
    expected_current_month,
):
    with freeze_time(freeze_datetime):
        start_utc, end_utc, remaining_days, current_month = (
            get_current_month_utc_range_and_days()
        )
        assert start_utc == expected_start_utc
        assert end_utc == expected_end_utc
        assert remaining_days == expected_remaining_days
        assert current_month == expected_current_month

        assert start_utc.tzinfo == datetime.timezone.utc
        assert end_utc.tzinfo == datetime.timezone.utc
