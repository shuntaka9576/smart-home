---
title: "自宅の消費電力を生成AIを使って簡易な分析、予測をしてみた"
type: "tech"
category: []
description: ""
published: false
---




## はじめに

本記事は [クラスメソッド発 製造業 Advent Calendar 2024](https://adventar.org/calendars/10479) の22日目の記事となります。

製造業との絡み的には、電力消費の可視化、分析、予測はよくあるテーマです。本記事では、まず身近な自宅を例に試してみることにしました。

とはいえ記事量の問題で、本記事ではデータ収集や生成AI周りのエコシステムを使いながらシステムを初期構築するところにフォーカスし、分析は簡易なものにしています。今後分析、予想にフォーカスした記事を書きたいと思います。

## 前提

[AWS IoT と 生成 AI を使って自宅の消費電力を測定・予測してみよう](https://aws.amazon.com/jp/builders-flash/202411/forecast-house-power-consumption/)の記事を見て着想をえました。構成や分析方法は全く異なります。よりチューニング余地を増やし、安定して安く手軽に運用できるようにしています。

:::message
本記事を読む上で以下の注意点があります。ご理解頂けると幸いです。🙇

* 日曜大工的な内容なのでデータ量は多くなく、大規模データ分析ではありません
* 初回の記事なので生成AIエコシステムを使うところがメインです。分析や予測はおまけ程度です (今後ブラッシュアップしたい)
* 命名規則の関係上、生成AIアプリ部分をAIエージェントと呼称していますが、エージェントになる過程です。単に生成AIを使ったアプリと読み替えてください

想定読者としては以下の通りです

* 自宅の電力データやセンサーデータを収集したい
* 生成AIエコシステム(LangGraph,MCP,LangChain,Bedrock)を使った分析アプリを作りたい
:::

本記事で紹介するプログラムは、全てこちらに置いています。アプリ、ドキュメント、インフラ全て用意しているので、参考になれば幸いです。

https://github.com/shuntaka9576/smart-home

## 生成AIを使って試す内容

### 概要

以下2つを試します。

* 電気料金の予測
* 電力量とその他指標の関連分析

### 手法

どのようなインプットに対して、どのようなアウトプットが返却されるのかを確認し、あくまで生成AIのエコシステムを体験できることを目的とします。精度の比較は別記事で行いたいと思います。

* 時系列データをインプットにする
* 時系列データの画像をインプットにする

また時系列データはMCPで取得できるようにするので、Claude Desktopを使った分析も行います。

### データの内容

|項|内容|期間|
|---|---|---|
|1.|過去の電気料金|2ヶ月分|
|2.|積算電力量,15分ごとの気温,湿度,照度,エアコンの起動状態のデータ|12月14日から計測開始|

以降これらのデータをセンサーデータと呼称します。

## 構成

### 必要なもの

|商品名|用途|
|---|---|
|[Nature Remo 3](https://amzn.asia/d/foS70lU)|気温,湿度,照度,エアコンの起動状態の起動状態の取得
|[Nature Remo E lite](https://amzn.asia/d/aSmi49w)|電力量の取得 ※ Bルート申請が必要(後述)

### 全体像

全体像は以下の通りです。以下の順で構成図の解説をします。

* データ収集
* データ配信
* 生成AI(Claude Desktop with MCP)による分析
* 生成AI(LangGraph)による分析

![architecture](https://devio2024-media.developers.io/image/upload/v1734727155/2024/12/21/n85ip5c2o1vqnavc9yvc.png)

### データ収集

まずはセンサーデータ(電力量,気温,湿度,照度,エアコンの起動状態)をデータ基盤(収集)で貯めます。今回使用しているNatureの機器で取得したデータは、NatureのクラウドAPIで取得できます。
![architecture_01](https://devio2024-media.developers.io/image/upload/v1734727141/2024/12/21/fnwcegqtqoox6hf6wgg5.png)

1. `[1]EventBridge` (15分に1回)でイベント発火
2. `[2]Lambda(センサーデータ書き込み)` を起動し、`[3]NatureのクラウドAPI`を実行し、データを取得し、`[4]Supabase`へ書き込み

### データ配信

今回は `AIエージェントアプリ` からも `Claude Desktop` から電力量、センサーデータはMCP経由で取得する予定のため、HTTP APIを構築します。このHTTP APIはGoのMCPサーバーでラップします。

![architecture_02](https://devio2024-media.developers.io/image/upload/v1734727145/2024/12/21/pd0svdremzy2yzavi6ho.png)

1. `[1]APIGateway`がHTTPリクエストを受け取る(期間指定since=yyyy-MM-dd HH:mm&until=yyyy-MM-dd HH:mm)
2. `[2]Lambda(センサーデータ配信)`が期間に応じたセンサーデーターを`[3]Supabase`に要求し受け取る
4. `[2]Lambda`から`[1]APIGateway` に返却し、AIエージェントアプリやClaude Desktopへセンサーデータを返却

### 生成AI(Claude Desktop with MCP)による分析

![architecture_03](https://devio2024-media.developers.io/image/upload/v1734727149/2024/12/21/drgo3eqzjjy6dbievcke.png)

1. `[2]Claude Desktop` のコンフィグ `[3]MCPサーバー` の設定
2. `[1]私` が `[2]Claude Desktop` を使い `[3]MCPサーバー` を経由し、`[4]APIGateway(センサーデータ配信)` からデータを取得
3. `[2]Claude Desktop` は項2で取得したデータを解析し、`[1]私` へ返却

### 生成AI(LangGraph)による分析

![architecture_04](https://devio2024-media.developers.io/image/upload/v1734736756/2024/12/21/zpmuylxuun1z9b0dd4te.png)

1. `[1]IFTTT` は外出を検知し、`[2]Lambda(AIエージェント)` へ `Webhook(HTTPS POST)` で機能実行を要求
2. `[2]Lambda(AIエージェント)` は、起動したLangGraphのワークフローを元に `[4]MCPサーバー` へ `JSON RPC 2.0 on 標準入力` でセンサーデータを要求
3. `[4]MCPサーバー` は、`[5]APIGateway(センサーデータ配信)` へ `HTTPS` でセンサーデータを要求
4. `[5]APIGateway(センサーデータ配信)` は、 `[5]Lambda(センサーデータ配信)` へ `AWS内部通信` でセンサーデータを要求
5. `[5]Lambda(センサーデータ配信)` へ `[6]Supabase(センサーデータ保存)` へ センサーデータを要求
6. 項5の通信の戻り
7. 項4の通信の戻り
8. 項3の通信の戻り
9. 項2の通信の戻り
10. `[2]Lambda(AIエージェント)` は受け取ったデータを元にBedrockを使いレポートを作成し、`[8]Slack` へ `Webhook(HTTPS POST)` でレポートを`[9]私`に送信

項1のIFTTTはあくまで例なので実装はないです。何らかの発火する概念が必要です。IFTTTだと外出タイミングで発火でき今回のユースケースと合っているかなと感じています。

Webhookをセキュアに運用する場合、ボディ部を予想されにくい文字列でSHA256ハッシュをつけてHTTPヘッダーにつけるのが良いでしょう。本記事では紹介しません。

## スマートメーターからデータを取得する前準備

### Bルート申請

Bルートサービスとは、スマートメーターで計測したデータをHEMS(ヘムス)機器へ送信するサービスです。以下のURLから申し込みが可能です。

https://www.tepco.co.jp/pg/consignment/liberalization/smartmeter-broute.html

1. Webで申請
2. パスワードがメールにて送付され、認証IDが郵送される

Webでの申請の注意点配下です。
* 供給地点番号を用意する
* 住所に契約している電力会社の託送上の住所で書く必要があり(私は建物名を抜かしてしまい、1度照合結果相違で再申し込みとなりました)

私は東京電力で契約しているのTEPCO Webから両方の情報を確認することできました。

東京在住で12/3(火)に申し込み12/5(木)にパスワード、12/9(月)には認証IDが郵送されました。参考までに。

認証IDは以下のような形で封書が届き、確認できます。

![1](https://devio2024-media.developers.io/image/upload/v1733959846/2024/12/12/fy6zalbu1pssxrzbdmdp.jpg)
![2](https://devio2024-media.developers.io/image/upload/v1733960014/2024/12/12/amlebgokmo7ficzbz7aa.jpg)

### HEMS機器の準備

AWSの記事では[Wi-SUN USBアダプター RS-WSUHAシリーズ](https://www.ratocsystems.com/products/wisun/usb-wisun/rs-wsuha/)が紹介されていましたが、[Nature Remo E lite](https://shop.nature.global/products/nature-remo-e-lite?srsltid=AfmBOophBk-D0lMmFneXFuJcOTBBWrcNufVktIVmOucfBRx72DythdPu)を使うことにしました。ラズパイは短期の検証では良いですが、運用面や料金面(AWS IoT)を考慮した結果です。ここら辺は好みですので、エッジIoTを体感したい人は冒頭のAWSの記事をベースにセットアップするのが良いと思います。

### Nature Remo E liteの設定

外箱はこんな感じです！
![IMG_3324](https://devio2024-media.developers.io/image/upload/v1733960432/2024/12/12/hkesrwv3yfvkusyfpxp4.jpg)

中身は思ったよりコンパクトと感じました！
![IMG_3325](https://devio2024-media.developers.io/image/upload/v1733960427/2024/12/12/gktcgvfajga5midygpij.jpg)

付属しているスタートアップガイドを元にNature Homeアプリを使って手順を行なっていきます。

このデバイスを画像のようにコンセントに繋ぐことで、スマートメーターの情報を取得することできます。
![IMG_3330 (2)](https://devio2024-media.developers.io/image/upload/v1733962689/2024/12/12/ok6qg2kvvua6ybxf3jmz.jpg)

アプリ側の設定は以下の通りです。

:::details アプリの設定

|説明|画像|
|---|---|
|アプリの指示に従って連携作業をします。WiFi設定後バージョン更新が入るので、数分時間がかかります。手順通りやるとアプリにNature Remo E liteが追加できます。|![IMG_3334](https://devio2024-media.developers.io/image/upload/v1733963759/2024/12/12/iwohlcffsdtt024bqbam.png)|
|赤枠をタップします|![IMG_3335＿２](https://devio2024-media.developers.io/image/upload/v1733963678/2024/12/12/wqruh9kmdneelv5pwzfr.png)|
|スマートメータとの接続が案内されます|![IMG_3336](https://devio2024-media.developers.io/image/upload/v1733963873/2024/12/12/nksgiqy37chredeirjbo.png)
|デバイスを選択します|![IMG_3337](https://devio2024-media.developers.io/image/upload/v1733963915/2024/12/12/dh6pzmp634k420kgzecm.png)|
|Bルート申請の認証IDとパスワードを入力します|![IMG_3338](https://devio2024-media.developers.io/image/upload/v1733963979/2024/12/12/cnwkovlojqvxezf4fcfv.png)
|検索->通信を経て数分で接続が完了します|![IMG_3341](https://devio2024-media.developers.io/image/upload/v1733964618/2024/12/12/rlucdrtns8e61wcvn1x5.png)
|スマートメータと連携が完了します|![IMG_3343](https://devio2024-media.developers.io/image/upload/v1733964636/2024/12/12/p8ud9meyxxjjlkgsa3qc.png)
|Remo E liteがエネルギータブの画面上部と中部に表示されました！|![IMG_3344](https://devio2024-media.developers.io/image/upload/v1733964648/2024/12/12/amschhdf4kk1afdjweiv.png)
|前項の画面中部をタップして内容を確認しましたが、まだ連携直後なので表示はありませんでした|![IMG_3345](https://devio2024-media.developers.io/image/upload/v1733964655/2024/12/12/vzlegnfgwg0dtdhb9zbc.png)
|少ししたらデータが入ってました！|![IMG_C0256F26C692-1 2](https://devio2024-media.developers.io/image/upload/v1733966032/2024/12/12/kw4yuqbqgrmbfbtywkj5.jpg)

:::

## センサーデータ収集実装

### 構成図

赤枠の実装をしていきます。

![architecture_01](https://devio2024-media.developers.io/image/upload/v1734727141/2024/12/21/fnwcegqtqoox6hf6wgg5.png)

### 実装

実装の全体感は[github.com/shuntaka9576/smart-home](https://github.com/shuntaka9576/smart-home/tree/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-data-platform)を参考にしてください。

#### Supabaseにテーブルを作成

まずテーブルを設計します。データ型はFloatにしましたが、 浮動小数点誤差を考慮するとDecimalが推奨です。(記事を公開したら、マイグレーションします。。)

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

この定義通り、Prismaのスキーマファイルを定義します。
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-data-platform/prisma/schema.prisma#L1-L23

Supabase上でプロジェクトを作成すると、DBのパスワードが発行されます。接続情報を元にホストマシンから接続。以下の接続先があり `Session pooler` のエンドポイントを使う。

* Direct connection
* Transaction pooler
* Session pooler <- を使う

セッションに入れることを確認。今回データベースはデフォルトの `postgres` を使うこととする。
```bash
psql "postgresql://postgres.<endpoint>:<password>J@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```
smart-home-data-platformの`.env` に `DATABASE_URL` を設定してマイグレーション

```bash:.env
DATABASE_URL="postgresql://postgres.<endpoint>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

```bash:スキーマのデプロイ
cd apps/smart-home-data-platform

pnpm prisma generate
pnpm prisma migrate dev --name init
```

#### アプリケーション実装

アプリの実装でポイントとなるのは基本的にデータ仕様です。今回使うNatureのグローバルAPIのエンドポイントは、以下の2つです。

|パス|用途|
|---|---|
|`/1/appliances`|電力量, 空調起動状態|
|`/1/devices`|気温,湿度,照度|

それぞれAPIを生で叩いてみます。

```bash
export NATURE_API_TOKEN="<APIトークン>"
```

電力量、空調起動状態が取れるAPIを叩いてみます。
```bash:リクエスト(/1/appliances)
curl -X GET "https://api.nature.global/1/appliances" -k --header "Authorization: Bearer $NATURE_API_TOKEN" | jq
```

コメントにて、利用するフィールドを記載しています。
```json:レスポンス(/1/appliances) ※ 一部
[
  {
    "device": {
      "name": "Remo",
      ...
    },
    ...
    "type": "AC",
    "nickname": "エアコン",
    "image": "ico_ac_1",
    "settings": {
      "temp": "23",
      "temp_unit": "c",
      "mode": "warm",
      "vol": "2",
      "dir": "1",
      "dirh": "still",
      "button": "", //  <-- 現在エアコンのリモコンを表すため、起動状態を判定可能
      "updated_at": "2024-12-21T00:30:06Z"
    },
    ....
  },
  {
    "device": {
      "name": "Remo E lite",
      ...
    },
    ...
    "type": "EL_SMART_METER",
    "nickname": "スマートメーター",
    "image": "ico_smartmeter",
    "settings": null,
    "aircon": null,
    "signals": [],
    "smart_meter": {
      "echonetlite_properties": [ // <-- ここのオブジェクトを電力量算出に利用
        {
          "name": "coefficient",
          "epc": 211,
          "val": "1",
          "updated_at": "2024-12-21T08:25:42Z"
        },
        {
          "name": "cumulative_electric_energy_effective_digits",
          "epc": 215,
          "val": "6",
          "updated_at": "2024-12-21T08:25:42Z"
        },
        {
          "name": "normal_direction_cumulative_electric_energy",
          "epc": 224,
          "val": "91954",
          "updated_at": "2024-12-21T08:25:42Z"
        },
        {
          "name": "cumulative_electric_energy_unit",
          "epc": 225,
          "val": "1",
          "updated_at": "2024-12-21T08:25:42Z"
        },
        {
          "name": "reverse_direction_cumulative_electric_energy",
          "epc": 227,
          "val": "13",
          "updated_at": "2024-12-21T08:25:42Z"
        },
        {
          "name": "measured_instantaneous",
          "epc": 231,
          "val": "350",
          "updated_at": "2024-12-21T08:25:43Z"
        }
      ]
    }
  }
]

```

その他気温、湿度、照度はこちらです。
```bash:リクエスト(/1/devices)
curl -X GET "https://api.nature.global/1/appliances" -k --header "Authorization: Bearer $NATURE_API_TOKEN" | jq
```

```json:レスポンス(/1/devices) ※ 一部
[
  {
    "name": "Remo",
    ...
    ],
    "newest_events": {
      "hu": {  // 湿度
        "val": 55,
        "created_at": "2024-12-21T08:27:13Z"
      },
      "il": { // 照度
        "val": 46,
        "created_at": "2024-12-21T08:25:07Z"
      },
      "mo": { // 人感
        "val": 1,
        "created_at": "2024-12-21T08:24:59Z"
      },
      "te": { // 気温
        "val": 25,
        "created_at": "2024-12-21T08:30:14Z"
      }
    },
    "online": true
  },
  {
    "name": "Remo E lite",
    ...
  }
]
```

基本的に電力量(cumulative_electric_energy)以外は、取得したものをそのままデータベース書き込みます。15分に1度EventBridge経由で実行し、書き込みを行います。それぞれの値に対して書き込み時間がついているので、厳密にやる場合はこの値も考慮した方が良いと思います。今回はほぼニアリアルに更新されるという前提で、15分ごとに書き込んでいます。

書き込み処理は以下の通りです。
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-data-platform/src/application/use-cases/store-home-condition-use-case.ts#L1-L19

電力量に関しては、`/1/appliances` NatureのAPIは、ECHONET Liteの仕様で一部値を返却します。Natureさんの[電力データ算出方法](https://developer.nature.global/docs/how-to-calculate-energy-data-from-smart-meter-values/)のドキュメントが非常に参考になりました。

[スマートメーターの各EPCの解説](https://developer.nature.global/docs/how-to-calculate-energy-data-from-smart-meter-values/#%E3%82%B9%E3%83%9E%E3%83%BC%E3%83%88%E3%83%A1%E3%83%BC%E3%82%BF%E3%83%BC%E3%81%AE%E5%90%84epc%E3%81%AE%E8%A7%A3%E8%AA%AC)をより、積算電力量計測値(正方向) `normal_direction_cumulative_electric_energy` と 積算電力量単位 `cumulative_electric_energy_unit` で乗算することで電力量(kWh)が求められます。実数部と単位を分けているのは浮動小数点誤差を考慮した設計によるものだと推測します。

積算電力量単位のユーティリティを実装
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-data-platform/src/domain/service/smart-meter-echonet-calculator.ts#L44-L69

積算電力量(正方向)と積算電力量単位を乗算しています。JavaScriptの計算誤差を防ぐためにdecimal.jsを使っています。(繰り返しにはなりますが、DBをDecimal型にしてPrisma.Decimalを使うのが良いと思います。)
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-data-platform/src/domain/service/smart-meter-echonet-calculator.ts#L15-L23

#### IaC

今回はLambdaから書き込むので、Prismaの場合クエリエンジンのバイナリを含める必要があり、少し面倒でした。[drizzle-orm](https://github.com/drizzle-team/drizzle-orm)や[kysely](https://github.com/kysely-org/kysely)なんかもおすすめです。

https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/iac/lib/smart-home-data-platform-resource.ts#L23-L35

LambdaのARM_64アーキテクチャを利用する場合はこちらで指定が必要です。
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-data-platform/prisma/schema.prisma#L3

### 確認

Supabaseのコンソール画面からデータが取り込まれていることが確認できます。

![CleanShot 2024-12-21 at 17.44.27@2x](https://devio2024-media.developers.io/image/upload/v1734770711/2024/12/21/m12nec3cy5val0mih3z1.png)

## センサーデータ配信実装

### 構成図

APIGatewayとLambdaのサーバーレス構成です。APIGatewayを使ったのは、APIキーでの認証が手軽にできるためです。

![architecture_02](https://devio2024-media.developers.io/image/upload/v1734727145/2024/12/21/pd0svdremzy2yzavi6ho.png)

### 実装

実装のエントリポイントは[こちら](https://github.com/shuntaka9576/smart-home/blob/daa4b240adef672f46447ceecc15a1409bbbae9c/apps/smart-home-data-platform/src/interfaces/lambda/api-gatway/rest-api-handler.ts)です。

#### アプリケーション

`yyyy-MM-dd HH:mm`でクエリパラメータにsinceとuntilを指定して、その期間のデータを取得するようにします。データベースに入っているのは`積算電力量(正方向)`なので、これはほぼずっとカウントアップしていきます。故にある時点とある時点の差が利用した電力量となります。

精度はざっくりにはなりますが、15分ごとの利用料を配列に詰めて返却しています。

https://github.com/shuntaka9576/smart-home/blob/daa4b240adef672f46447ceecc15a1409bbbae9c/apps/smart-home-data-platform/src/domain/service/smart-meter-echonet-calculator.ts#L78-L87

今後N分足、N時間足、日足という感じで動的に計算できるようにしたいですね。

#### IaC

センサーデータ収集実装同様のPrimaのデプロイ設定が必要です。

https://github.com/shuntaka9576/smart-home/blob/daa4b240adef672f46447ceecc15a1409bbbae9c/iac/lib/smart-home-data-platform-resource.ts#L73-L123

### 確認

デプロイしたAPIGatewayにリクエストを送ってデータが取得できることを確認します。

```bash:APIGatewayのエンドポイントとAPIキーをマネジメントコンソールからコピーして設定する
export SMART_HOME_API_GATEWAY_DOMAIN="" # https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/v1 まで含める
export SMART_HOME_API_KEY=""
```

```bash:センサーデータの取得
curl -X GET \
  -H "Accept: application/json" \
  -H "x-api-key: $SMART_HOME_API_KEY" \
  "$SMART_HOME_API_GATEWAY_DOMAIN/home-condition?since=2024-12-19%2000:00&until=2024-12-19%2001:00"
```

```json:結果
{
  "homeConditions": [
    {
      "id": "3caaa05a-92ed-4ba3-955c-b0215750201c",
      "cumulativeElectricEnergy": 9180.2,
      "measuredInstantaneous": 94,
      "temperature": 16,
      "humidity": 80,
      "illuminance": 0,
      "acStatus": false,
      "createdAt": "2024-12-19T00:00:35.849+09:00",
      "updatedAt": "2024-12-19T00:00:35.849+09:00",
      "electricEnergyDelta": 23.9
    },
    {
      "id": "199e2ffd-466c-4f6d-a770-00a5c1d6c710",
      "cumulativeElectricEnergy": 9180.2,
      "measuredInstantaneous": 84,
      "temperature": 16,
      "humidity": 80,
      "illuminance": 0,
      "acStatus": false,
      "createdAt": "2024-12-19T00:15:36.332+09:00",
      "updatedAt": "2024-12-19T00:15:36.332+09:00",
      "electricEnergyDelta": 0
    },
    {
      "id": "52925c69-6dd6-407e-8689-ef65cffb8c01",
      "cumulativeElectricEnergy": 9180.3,
      "measuredInstantaneous": 51,
      "temperature": 15.8,
      "humidity": 80,
      "illuminance": 0,
      "acStatus": false,
      "createdAt": "2024-12-19T00:30:36.170+09:00",
      "updatedAt": "2024-12-19T00:30:36.170+09:00",
      "electricEnergyDelta": 0.1
    },
    {
      "id": "0a9fd4f0-54d8-4098-9b36-300aebd4c769",
      "cumulativeElectricEnergy": 9180.3,
      "measuredInstantaneous": 69,
      "temperature": 15.7,
      "humidity": 80,
      "illuminance": 0,
      "acStatus": false,
      "createdAt": "2024-12-19T00:45:35.800+09:00",
      "updatedAt": "2024-12-19T00:45:35.800+09:00",
      "electricEnergyDelta": 0
    }
  ]
}
```

本項でセンサーデータの配信ができるようになりました。

## MCPサーバーの実装

### 概要

データの配信ができるようになったので、このAPIをラップしてMCPサーバーを構築します。MCPについて解説します。

[MCP(Model Context Protocol)](https://modelcontextprotocol.io/introduction)は、LLMアプリケーションと外部データソースを連携するオープンプロトコルでAnthropicが仕様化しました。身近なところで、あらゆるエディタで補完や警告機能を出来るようにし、当時革命的だったLSP(Language Server Protocol)を参考にしてます。

MCPサーバーは別プロセスとして起動し、LLMアプリケーション内のMCPクライアントと `標準入出力` か `SSE` を使い通信します。メッセージフォーマットは、JSON-RPC 2.0を採用しており、LSPと同じです。

なぜ作ったのか？それは複数のLLMアプリケーション(Cloud DesktopやIDE(VSCode, IntelliJ))で、コンテキストの提供を共通化するためです。LSPがVSCode, Emacs, Vim, Neovim, IntelliJで同様に警告や補完機能を実現しているのと似ていますね！

今回MCPサーバー実装は、別のLLMアプリケーションと通信することを考慮し、外部依存が少なくなるようGoで実装しました[^1]。別のLLMアプリと通信しない場合、MCPサーバーの実装を、AIエージェント側に関数として実装するのが良いと思います。

[^1]: 今回はエコシステムを試す目的もあるのである種無理やりこのレイヤーを噛ませています。公式のSDKはPythonとTypeScriptなのでそちらを使った方が楽に実装できると思います。JSの場合、バンドルが可能ですが、Node自体に依存(ただ、NodeのSingle executable appやdeno compileだとランタイムが同梱されるため回避できます)。Pythonの場合、Pythonそのものとライブラリに依存
。シングルバイナリになるRustやZigなども良い選択肢だと思います。

### 構成図

以下の赤枠部分を実装します。ClaudeDesktopではローカルマシンに入れます。クラウドで動かす際は、AIエージェントのコンテナの中に入れて起動します。

![architecture](https://devio2024-media.developers.io/image/upload/v1734806143/2024/12/22/slwsjijtxef3hvnadabb.png)

### 実装

実装は[こちら](https://github.com/shuntaka9576/smart-home/tree/daa4b240adef672f46447ceecc15a1409bbbae9c/apps/smart-home-mcp-server)のディレクトリにあります。

今回はPythonのプロセスとGoのプロセスで標準入出力を使って通信します。[Model Context Protocol サーバーをGoで実装する](https://zenn.dev/masacento/articles/3e91c61f20787b)を参考に実装の略図を書くと以下の通りです。

![mcp_go_model](https://devio2024-media.developers.io/image/upload/v1734816303/2024/12/22/tnxon7tj5wccizswjkj4.png)

MCPの`tools/list`が呼び出されたら、以下のJSONを返却し、LLMがFunction calling(Tool Use)が呼び出せるようにします。

`tools/list`のレスポンス箇所
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-mcp-server/tools.json#L1-L91

`tools/list`が呼び出し箇所
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-mcp-server/worker.go#L30-L36

MCPの[Tools](https://modelcontextprotocol.io/docs/concepts/tools)仕様を参考に、 nameがlist-home-conditionの場合に、前項で作成したAPIを呼び出してレスポンスを返却するようにしています。
```
{
  name: string;          // Unique identifier for the tool
  description?: string;  // Human-readable description
  inputSchema: {         // JSON Schema for the tool's parameters
    type: "object",
    properties: { ... }  // Tool-specific parameters
  }
}
```
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-mcp-server/worker.go#L37-L71

ゆえに電力量や各種センサーデータの配信で実装した`SMART_HOME_API_GATEWAY_DOMAIN` を使います。

```bash:.envを作成
cp .env.local .env
```

掲載のコードでは、v1部分まで必要です。
```bash:.env
SMART_HOME_API_GATEWAY_DOMAIN="https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/v1"
```

Goビルド時はMakefile経由で`.env` を参照してエンドポイントを埋め込みます。(これはリポジトリを公開する都合上で、公開しない場合やエンドポイントを知られても問題ない場合はハードコードしても良いと思います。これはリリースバージョンのbump upなどでよく使われる手法です。)

```bash
make build
```

デバック作業は、後述するPythonのAIエージェントアプリの標準出力にMCPサーバーの標準出力が書き込まれるためそちらで確認しました。公式ドキュメントには、[デバックの方法](https://modelcontextprotocol.io/docs/tools/debugging)も乗っているので、こちらを参考にしても良いと思います。

動作確認は、次項でClaude Desktopを使って行います。

## Claude Desktop(with 作成したMCPサーバー)で分析してみる

### 構成図

ここまでで収集と配信とMCPを実装したので、Claude Desktopで自宅の電力量が簡易に分析できるようになります。イメージが湧き辛いのでやってみます。
![architecture_03](https://devio2024-media.developers.io/image/upload/v1734727149/2024/12/21/drgo3eqzjjy6dbievcke.png)

### Claude Desktopのコンフィグの設定

APIGatewayのAPIキーがCDKで自動的に発行されているので、そちらを`mcpServers.smart-home-mcp-server.env.SMART_HOME_API_KEY`に記載してください。

```bash
nvim ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

```json:~/Library/Application\ Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "smart-home-mcp-server": {
      "command": "/Users/shuntaka/repos/github.com/shuntaka9576/smart-home/apps/smart-home-ai-agent/smart-home-mcp-server",
      "args": [],
      "env": {
        "SMART_HOME_API_KEY": "<APIGatewayのAPIキー>" // <- ここに入れてね
      }
    }
  }
}
```

### 分析してみる

今日の電力量を確認してみます。

![CleanShot 2024-12-22 at 04.04.34@2x](https://devio2024-media.developers.io/image/upload/v1734807907/2024/12/22/eepcum6vggamdjmzucsi.png)

内訳を見ると、`since`: `2024-12-22 00:00`に`until`: `2024-12-22 23:59` を指定して呼び出していることがわかります。
![CleanShot 2024-12-22 at 04.06.02@2x](https://devio2024-media.developers.io/image/upload/v1734807992/2024/12/22/oh1bahp3y6bnv1f2lztq.png)

:::details 内訳全部
{
  `since`: `2024-12-22 00:00`,
  `until`: `2024-12-22 23:59`
}
[{"cumulativeElectricEnergy":9196.6,"measuredInstantaneous":94,"temperature":18.1,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T00:00:36.027+09:00","updatedAt":"2024-12-22T00:00:36.027+09:00","electricEnergyDelta":40.3},{"cumulativeElectricEnergy":9196.6,"measuredInstantaneous":98,"temperature":18.1,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T00:15:36.145+09:00","updatedAt":"2024-12-22T00:15:36.145+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.6,"measuredInstantaneous":68,"temperature":17.9,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T00:30:35.874+09:00","updatedAt":"2024-12-22T00:30:35.874+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.7,"measuredInstantaneous":86,"temperature":17.8,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T00:45:35.95+09:00","updatedAt":"2024-12-22T00:45:35.95+09:00","electricEnergyDelta":0.1},{"cumulativeElectricEnergy":9196.7,"measuredInstantaneous":222,"temperature":17.8,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T01:00:36.108+09:00","updatedAt":"2024-12-22T01:00:36.108+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.7,"measuredInstantaneous":222,"temperature":17.7,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T01:15:35.916+09:00","updatedAt":"2024-12-22T01:15:35.916+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.8,"measuredInstantaneous":102,"temperature":17.7,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T01:30:35.783+09:00","updatedAt":"2024-12-22T01:30:35.783+09:00","electricEnergyDelta":0.1},{"cumulativeElectricEnergy":9196.8,"measuredInstantaneous":151,"temperature":17.7,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T01:45:35.885+09:00","updatedAt":"2024-12-22T01:45:35.885+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.9,"measuredInstantaneous":130,"temperature":17.6,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T02:00:36.169+09:00","updatedAt":"2024-12-22T02:00:36.169+09:00","electricEnergyDelta":0.1},{"cumulativeElectricEnergy":9196.9,"measuredInstantaneous":100,"temperature":17.4,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T02:15:36.241+09:00","updatedAt":"2024-12-22T02:15:36.241+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.9,"measuredInstantaneous":100,"temperature":17.3,"humidity":71,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T02:30:36.118+09:00","updatedAt":"2024-12-22T02:30:36.118+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9196.9,"measuredInstantaneous":89,"temperature":17.2,"humidity":72,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T02:45:35.934+09:00","updatedAt":"2024-12-22T02:45:35.934+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9197,"measuredInstantaneous":86,"temperature":17,"humidity":72,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T03:00:36.212+09:00","updatedAt":"2024-12-22T03:00:36.212+09:00","electricEnergyDelta":0.1},{"cumulativeElectricEnergy":9197,"measuredInstantaneous":86,"temperature":16.9,"humidity":72,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T03:15:35.829+09:00","updatedAt":"2024-12-22T03:15:35.829+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9197,"measuredInstantaneous":81,"temperature":16.8,"humidity":72,"illuminance":0,"acStatus":false,"createdAt":"2024-12-22T03:30:35.803+09:00","updatedAt":"2024-12-22T03:30:35.803+09:00","electricEnergyDelta":0},{"cumulativeElectricEnergy":9197.2,"measuredInstantaneous":180,"temperature":17.6,"humidity":73,"illuminance":40,"acStatus":true,"createdAt":"2024-12-22T03:45:36.216+09:00","updatedAt":"2024-12-22T03:45:36.216+09:00","electricEnergyDelta":0.2},{"cumulativeElectricEnergy":9197.2,"measuredInstantaneous":553,"temperature":18.7,"humidity":72,"illuminance":40,"acStatus":true,"createdAt":"2024-12-22T04:00:35.942+09:00","updatedAt":"2024-12-22T04:00:35.942+09:00","electricEnergyDelta":0}]
:::

LLMは単純な計算処理が苦手です。先ほどの結果には間違いがあります。なので再度問い合わせたところ正しい回答が返ってきました。
![CleanShot 2024-12-22 at 04.08.58@2x](https://devio2024-media.developers.io/image/upload/v1734808336/2024/12/22/wfvxrf95c0t1vkzg2tgy.png)

今度は簡単な可視化をさせてみます。Claude ArtifactsでReactコードが生成されていきます。
![CleanShot 2024-12-22 at 04.16.37@2x](https://devio2024-media.developers.io/image/upload/v1734808649/2024/12/22/ozkc5kkfgjydntytqmau.png)

グラフが生成されました。時間を絞っているのは1日分だと15分足だとデータ量が多すぎてコード生成が間に合わずクラッシュするためです。Reactのコードなので描画が綺麗ですね。
![CleanShot 2024-12-22 at 04.18.12@2x](https://devio2024-media.developers.io/image/upload/v1734808708/2024/12/22/mhonsy95wvsigdebrnr9.png)

ダッシュボードみたいなものも作れますね。
![CleanShot 2024-12-19 at 08.50.03@2x](https://devio2024-media.developers.io/image/upload/v1734813121/2024/12/22/ohdsm8zi8goezsmvey5c.png)

15度下回ると暖房をつけるといった人によっては気付けないような部分も面白いです。
![CleanShot 2024-12-19 at 08.53.13@2x](https://devio2024-media.developers.io/image/upload/v1734813021/2024/12/22/kgaxlbh0n39u9spjclpm.png)

Claude Artifactsのような仕組みを自前で作るのは大変なので、MCPサーバーでAPIをラップしてClaude Desktopで解析するのは手軽ので良いと思いました。データ量が少なければある程度のことはできそうです。

## 生成AI(LangGraph)による分析

### 構成図

![architecture_04](https://devio2024-media.developers.io/image/upload/v1734736756/2024/12/21/zpmuylxuun1z9b0dd4te.png)

LangGraphとはLLM (Lagre Language Models; 大規模言語モデル)を使用した、ステートフルなエージェントやワークフローを作成するためのライブラリです。個人的にはLangSmithと簡単に連携できるので、ワークフローのデバックやトラブルシュートに便利です。

### IaC

FastAPIをLambda+LWA構成でホスティングします。15分間は生成に使えます。LWAは今後ストリーミングに対応したい場合やECSに載せ替えたい場合でも融通が効きます。前述したGoのMCPサーバーのビルドもこの中でやります。

https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-ai-agent/Dockerfile#L1-L36

### 実装方針

LangGraphのワークフローは2つ作ります。実際にアプリを作るなら両方渡してもいいですし、ワークフローは1つで良いと思います。説明や検証のため今回はこの構成をとっています。

* 時系列データをインプットにする
* 時系列データの画像をインプットにする

モデルはこちらを利用します。

https://github.com/shuntaka9576/smart-home/blob/95b934a59e9235f3d00e4d49735eafc5ef10fdb6/apps/smart-home-ai-agent/src/agent/common.py#L4

### 時系列データをインプットにする場合

![forecast_by_data](https://devio2024-media.developers.io/image/upload/v1734810411/2024/12/22/dtll3ngzl5qkfv4p6z58.png)

`forecast_electric_energy_by_data_node`は、今月の電気料金を予測を、時系列データを元に行います。プロンプトは以下の通りです。過去の明細(10月,11月)はプロンプトで持たせています。

https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-ai-agent/src/agent/prompt/common.py#L29-L57

API問い合わせはFunction Calling(Tool Use)を統一のIFにしたTool Callingを使います。

https://zenn.dev/pharmax/articles/1b351b730eef61

また`create_react_agent`は、Toolの利用すべきかを判断し、実行をしてくれます。これは普通に実装するとツール利用の有無の判定とツールの実行処理を自前で書くコストがなくなり非常に便利です。詳しくは以下をご確認ください。
https://zenn.dev/pharmax/articles/1b351b730eef61#langgraph%EF%BC%88create_react_agent%EF%BC%89

`create_react_agent`実装は以下の通りです。
https://github.com/shuntaka9576/smart-home/blob/95b934a59e9235f3d00e4d49735eafc5ef10fdb6/apps/smart-home-ai-agent/src/agent/workflows/forecast_by_data/forecast_electric_energy_by_data_node.py#L1-L34

mcp_sessionからToolsを呼び出して、`create_react_agent`に渡しています。これでセンサーデータの取得をLLM側に行ってくれます。
https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-ai-agent/src/agent/workflows/forecast_by_data/forecast_electric_energy_by_data_node.py#L17

`adjutmet_message_for_slack_node` では出力されたレポートをSlackライクのメッセージに変換します。プロンプトは以下の通りです。

https://github.com/shuntaka9576/smart-home/blob/aa52f767849f2bad2298730147e1c328978707f1/apps/smart-home-ai-agent/src/agent/workflows/common/adjutmet_message_for_slack_node.py#L19-L22

こちらを実行します。実行すると以下のような結果が得られました。Slack向けに整形させたので、emojiを使ってみやすい形になっています。

![CleanShot 2024-12-22 at 05.08.59@2x](https://devio2024-media.developers.io/image/upload/v1734811761/2024/12/22/dvsmjvraybdbv8docp9t.png)

実際のグラフデータと比較してみますが、やはりレポート内容は一般的な内容に終始しており、まだ入力データやプロンプトの見直しが必要だなと感じました。データ量が増えてくるとより料金試算のロジックが納得しやすいものになりそうです。
![tmphuxyqmdh](https://devio2024-media.developers.io/image/upload/v1734812742/2024/12/22/qinit2ncaahcb1f7tfxm.png)

LangSmithのメトリクスデータを確認します。

![CleanShot 2024-12-22 at 05.11.33@2x](https://devio2024-media.developers.io/image/upload/v1734811929/2024/12/22/z7imtoa5mser1g7mpcvd.png)

詳しくみるとセンサーデータの取得がTool Callingで行われていることが確認できます。
![CleanShot 2024-12-22 at 05.13.24@2x](https://devio2024-media.developers.io/image/upload/v1734812066/2024/12/22/hsauj5chy3ith1rsdura.png)

### 時系列データの画像をインプットにする場合

前項のやり方ですと、トークンサイズの問題があるので、画像を使います。

![forecast_by_png](https://devio2024-media.developers.io/image/upload/v1734810416/2024/12/22/czlfybhl6pha2akikl2p.png)

| Node Name                             | Explanation                                                                                   |
|---------------------------------------|-----------------------------------------------------------------------------------------------|
| `get_sensor_duration_node`            | 明細データを元にグラフ作る期間をLLMに生成してもらう                           |
| `gen_sensor_data_graph_node`          | 前ノードの期間を元にグラフを生成(LLMは使いません)                   |
| `forecast_electric_energy_by_png_node`| 前ノードの画像を元にLLMに予測         |
| `adjustmet_message_for_slack_node`    | 前項どのようにSlackメッセージにLLMで整形       |

Slackへレポートと生成した画像の両方を送ってもらいます。
https://github.com/shuntaka9576/smart-home/blob/737d6f6a8f25d22f6665ffea6b8ea07bfc08dc9f/apps/smart-home-ai-agent/src/application/use_case/create_electric_energy_report_use_case.py#L21-L22

結果は以下の通りです。

レポート
![CleanShot 2024-12-22 at 05.26.33@2x](https://devio2024-media.developers.io/image/upload/v1734812814/2024/12/22/m8wqs2f0el8jaikjrxhg.png)

インプットの画像(拡大)
![tmphuxyqmdh](https://devio2024-media.developers.io/image/upload/v1734812742/2024/12/22/qinit2ncaahcb1f7tfxm.png)

こちらもある程度傾向を掴んでいるように見えます。

LangSmithのメトリクスデータを確認します。予測する部分のLLMの処理が一番時間がかかっていますね！

![CleanShot 2024-12-22 at 05.37.20@2x](https://devio2024-media.developers.io/image/upload/v1734813506/2024/12/22/c5anfew97cwr9cllextj.png)

## さいごに

今回は生成AIを使って短い期間の分析をしました。であればある程度信頼性のある傾向を出力してくれるので利用価値が高そうだなと思いました。

生成AIエコシステムもさまざまなライブラリがあり、特にo11y周りのlangSmithは生成AIアプリのチューニングで必要不可欠です。自然言語やバイナリのインプットとアウトプットがワークフローの中で複雑に遷移するので、同じことをロギングでやるには非常に骨が折れます。これがプロダクトユースになると価格面やセキュリティ面でlangfuseになりやすい気がしますが、やはり本家はよく出来ています。

また今後Claude DesktopのようなLLMクライアントが高度化してくるとMCPは重要だなと思いました。連携さえしてしまえば個人的なデータもサブスク料金内で自由に解析ができるため、便利です。他のベンダーも追従するといいですね。

今後やってみたいことは以下の通りです。

* アウトプットの検証(今回一番やらないといけないところでしたが、力尽きました、、)
* MCPサーバーの機能として今回はToolsしか使ってないので、ResourceやPrompts、Samplingも実装しようと思います！
* Pandas Dataframe Agentを使った自動生成コードによる解析(今回のようなデータ量が多い場合でも比較的トークン数少なめで柔軟に解析可能)

実際説明しきれていない部分はいくつかあります。ただ公開していないコードはないので、リポジトリを見れば同じものは作れると思います。

何かあれば、issueにお願いします！

## 参考資料

脚注も合わせて様々な記事を参考にさせて頂きました。ありがとうございます。

* [AWS IoT と 生成 AI を使って自宅の消費電力を測定・予測してみよう](https://aws.amazon.com/jp/builders-flash/202411/forecast-house-power-consumption/)
* [Nature Remo E liteで、おうちの消費電力を見える化してみた](https://qiita.com/c60evaporator/items/4040040095aa58dcb5b1)
* [SlackにAPI経由でファイルをアップロードする(Python)](https://qiita.com/munaita_/items/97105648165f6a60442c)
* [Slackチャンネルにメッセージを投稿できるSlackAppを作成する](https://dev.classmethod.jp/articles/post-messages-to-slack-channel/)
