import sys
from pathlib import Path


def setup_python_path():
    current_dir = Path(__file__).resolve().parent
    project_root = current_dir.parent
    sys.path.insert(0, str(project_root))


def generate_mermaid_graph():
    """Generate and output Mermaid graph as PNG files."""
    try:
        from src.agent.workflows.forecast_by_data.workflow import (
            create_forecast_electric_energy_by_data_workflow,
        )
        from src.agent.workflows.forecast_by_png.workflow import (
            create_forecast_electric_energy_by_png_workflow,
        )

        # 出力先ディレクトリを作成
        output_dir = Path(__file__).resolve().parent / "../output"
        output_dir.mkdir(exist_ok=True)

        # 1つ目のグラフ
        workflow1 = create_forecast_electric_energy_by_data_workflow()
        compiled1 = workflow1.compile()
        graph1 = compiled1.get_graph()
        mermaid_png_data1 = graph1.draw_mermaid_png()

        # ファイルに書き込み
        output_file_1 = output_dir / "forecast_by_data.png"
        with open(output_file_1, "wb") as f:
            f.write(mermaid_png_data1)
        print(f"Saved: {output_file_1}")

        # 2つ目のグラフ
        workflow2 = create_forecast_electric_energy_by_png_workflow()
        compiled2 = workflow2.compile()
        graph2 = compiled2.get_graph()
        mermaid_png_data2 = graph2.draw_mermaid_png()

        # ファイルに書き込み
        output_file_2 = output_dir / "forecast_by_png.png"
        with open(output_file_2, "wb") as f:
            f.write(mermaid_png_data2)
        print(f"Saved: {output_file_2}")

        return True
    except Exception as e:
        print(f"Error generating graph: {e}", file=sys.stderr)
        return False


def main():
    setup_python_path()
    success = generate_mermaid_graph()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
