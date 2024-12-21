from src.infra.smart_home_api_client import HomeCondition
from typing import List
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import zoneinfo
import matplotlib
import tempfile

# ruff: noqa: F401
import japanize_matplotlib

matplotlib.use("Agg")


def plot_top_graph(fig, data):
    tz_jst = zoneinfo.ZoneInfo("Asia/Tokyo")
    ax1 = fig.add_subplot(1, 1, 1)
    ax1.plot(data.index, data["temperature"], color="red", label="気温 (°C)")
    ax1.plot(data.index, data["humidity"], color="blue", label="湿度 (%)")
    ax1.plot(data.index, data["illuminance"], color="orange", label="照度 (lux)")
    ax1.plot(
        data.index, data["ac_status"], color="purple", label="エアコン起動状態(0/1)"
    )

    ax2 = ax1.twinx()
    ax2.bar(
        data.index,
        data["electric_energy_delta"],
        label="電力量Δ (kWh)",
        color="green",
        alpha=0.5,
        width=0.01,
        align="center",
    )

    major_locator = mdates.HourLocator(interval=3)
    # minor_locator = mdates.MinuteLocator(byminute=[0, 30])
    formatter = mdates.DateFormatter("%Y-%m-%d %H:%M", tz=tz_jst)

    ax1.xaxis.set_major_locator(major_locator)
    # ax1.xaxis.set_minor_locator(minor_locator)
    ax1.xaxis.set_major_formatter(formatter)
    ax1.set_xlabel("時刻")
    ax1.set_ylabel("温度/湿度/照度/エアコン起動状態")
    ax2.set_ylabel("電力量Δ(kWh)")

    lines_1, labels_1 = ax1.get_legend_handles_labels()
    lines_2, labels_2 = ax2.get_legend_handles_labels()
    ax1.legend(lines_1 + lines_2, labels_1 + labels_2, loc="upper left")
    plt.setp(ax1.get_xticklabels(), rotation=45, ha="right")
    ax1.set_title("センサーデータ可視化結果")
    ax1.grid(True)


def analysis_smart_home_data(homeConditions: List[HomeCondition]):
    data = pd.DataFrame([vars(h) for h in homeConditions])
    data["created_at"] = pd.to_datetime(data["created_at"], utc=True)
    data["created_at"] = data["created_at"].dt.tz_convert("Asia/Tokyo")
    data.set_index("created_at", inplace=True)

    fig = plt.figure(figsize=(15, 10))

    plot_top_graph(fig, data)

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
        plt.tight_layout()
        plt.savefig(tmp_file.name)
        output_file_path = tmp_file.name

    plt.close(fig)

    return output_file_path
