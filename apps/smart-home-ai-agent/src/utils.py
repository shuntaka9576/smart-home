import datetime

JST = datetime.timezone(datetime.timedelta(hours=9))


def get_current_month_utc_range_and_days():
    now_jst = datetime.datetime.now(JST)
    start_of_month_jst = datetime.datetime(
        now_jst.year, now_jst.month, 1, 0, 0, 0, tzinfo=JST
    )
    if now_jst.month == 12:
        next_month_year = now_jst.year + 1
        next_month_month = 1
    else:
        next_month_year = now_jst.year
        next_month_month = now_jst.month + 1

    end_of_month_jst = datetime.datetime(
        next_month_year, next_month_month, 1, 0, 0, 0, tzinfo=JST
    )

    start_of_month_utc = start_of_month_jst.astimezone(datetime.timezone.utc)
    end_of_month_utc = end_of_month_jst.astimezone(datetime.timezone.utc)

    remaining_days = (end_of_month_jst - now_jst).days
    current_month = now_jst.month

    return start_of_month_utc, end_of_month_utc, remaining_days, current_month
