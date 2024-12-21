# データベース

```{toctree}
:maxdepth: 2
:caption: database
```

## ER図

TODO

## テーブル詳細設計

### homeCondition テーブル

| フィールド名                     | データ型   | PK | FK | 必須 | その他制約 | デフォルト | 列挙値 | 説明 |
|----------------------------------|------------|----|----|------|------------|------------|--------|------|
| id                               | String     | ◯  |    | ◯    | -          | -          | -      |UUID|
| cumulative_electric_energy       | Float      |    |    | ◯    | -          | -          | -      |積算電力量計測値(kWh)|
| measured_instantaneous           | Float      |    |    | ◯    | -          | -          | -      |瞬時電力計測値(w)|
| temperature                      | Float      |    |    | ◯    | -          | -          | -      |気温|
| humidity                         | Float      |    |    | ◯    | -          | -          | -      |湿度|
| illuminance                      | Float      |    |    | ◯    | -          | -          | -      |照度|
| ac_status                        | Boolean    |    |    | ◯    | -          | -          | -      |エアコンステータス|
| created_at                       | DateTime   |    |    | ◯    | -          | 現在時刻   | -      |作成タイムスタンプ(※1)|
| updated_at                       | DateTime   |    |    | ◯    | -          | 現在時刻   | -      |作成タイムスタンプ(※1)|

※1

作成タイムスタンプは、厳密にはその時点の値を示していない。今回は厳密にやらずに、レコード書き込みタイミングがその時点の部屋の状態として、誤差は許容。

厳密にやる場合は、Nature Remo E Liteの積算電力量計測値や瞬時電力計測値やNature Remo(温度,湿度,照度)は、それぞれがタイムスタンプを持っているのでそれ活用するのが良い。テーブル設計は、取得メトリクスとその取得デバイスが同じ場合は、タイムスタンプがほぼ一緒になることを考慮するとよい。


## よく使うSQL

* 事前に`\x`コマンドを利用し表示領域を調整してください。

### 全記事データ取得

<details>
<summary>SQL</summary>

```sql
```

</details>
