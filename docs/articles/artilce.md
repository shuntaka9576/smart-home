---
title: "自宅の消費電力を生成AIを使って簡易な分析、予測をしてみた"
type: "tech"
category: []
description: ""
published: false
---


## はじめに

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
* MCPサーバーを構築したい
* LangGraphを使った簡単な分析アプリを作りたい
:::

本記事で紹介するプログラムは、全てこちらに置いています。アプリ、ドキュメント、インフラ全て用意しているので、参考になれば幸いです。

https://github.com/shuntaka9576/smart-home

## 生成AIを使って試す内容

### 概要

以下2つを試します

* 電気料金の予測
* 電力量とその他指標の関連分析

### 手法

今回は精度はそこまで気にせずどのようなインプットに対して、どのようなアウトプットが返却されるのか検証します。分析方法は以下の通りです。

* 時系列データのプロンプト投入
* 時系列データの画像投入

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

### 構成図

#### 全体像

全体像は以下の通りです。以下の順で構成図の解説をします。

* データ収集
* データ配信
* Claude Desktopによる分析
* 生成AIによる分析

![architecture](https://devio2024-media.developers.io/image/upload/v1734727155/2024/12/21/n85ip5c2o1vqnavc9yvc.png)


#### データ収集

まずはセンサーデータ(電力量,気温,湿度,照度,エアコンの起動状態)をデータ基盤(収集)で貯めます。今回使用しているNatureの機器で取得したデータは、NatureのクラウドAPIで取得できます。
![architecture_01](https://devio2024-media.developers.io/image/upload/v1734727141/2024/12/21/fnwcegqtqoox6hf6wgg5.png)

1. `[1]EventBridge` (15分に1回)でイベント発火
2. `[2]Lambda(センサーデータ書き込み)` を起動し、`[3]NatureのクラウドAPI`を実行し、データを取得し、`[4]Supabase`へ書き込み

#### データ配信

今回は `AIエージェントアプリ` からも `Claude Desktop` から電力量、センサーデータはMCP経由で取得する予定のため、HTTP APIを構築します。このHTTP APIはGoのMCPサーバーでラップします。

![architecture_02](https://devio2024-media.developers.io/image/upload/v1734727145/2024/12/21/pd0svdremzy2yzavi6ho.png)

1. `[1]APIGatway`がHTTPリクエストを受け取る(期間指定since=yyyy-MM-dd HH:mm&until=yyyy-MM-dd HH:mm)
2. `[2]Lambda(センサーデータ配信)`が期間に応じたセンサーデーターを`[3]Supabase`に要求し受け取る
4. `[2]Lambda`から`[1]APIGatway` に返却し、AIエージェントアプリやClaude Desktopへセンサーデータを返却


#### 生成AI(Claude Desktop with MCP)による分析

![architecture_03](https://devio2024-media.developers.io/image/upload/v1734727149/2024/12/21/drgo3eqzjjy6dbievcke.png)

1. `[2]Claude Desktop` のコンフィグ `[3]MCPサーバー` の設定
2. `[1]私` が `[2]Claude Desktop` を使い `[3]MCPサーバー` を経由し、`[4]APIGatway(センサーデータ配信)` からデータを取得
3. `[2]Claude Desktop` は項2で取得したデータを解析し、`[1]私` へ返却

#### 生成AI(LangGraph)による分析

![architecture_04](https://devio2024-media.developers.io/image/upload/v1734736756/2024/12/21/zpmuylxuun1z9b0dd4te.png)

1. `[1]IFTTT` は外出を検知し、`[2]Lambda(AIエージェント)` へ `Webhook(HTTPS POST)` で機能実行を要求
2. `[2]Lambda(AIエージェント)` は、起動したLangGraphのワークフローを元に `[4]MCPサーバー` へ `JSON RPC 2.0 on 標準入力` でセンサーデータを要求
3. `[4]MCPサーバー` は、`[5]APIGatway(センサーデータ配信)` へ `HTTPS` でセンサーデータを要求
4. `[5]APIGatway(センサーデータ配信)` は、 `[5]Lambda(センサーデータ配信)` へ `AWS内部通信` でセンサーデータを要求
5. `[5]Lambda(センサーデータ配信)` へ `[6]Supabase(センサーデータ保存)` へ センサーデータを要求
6. 項5の通信の戻り
7. 項4の通信の戻り
8. 項3の通信の戻り
9. 項2の通信の戻り
10. `[2]Lambda(AIエージェント)` は受け取ったデータを元にBedrockを使いレポートを作成し、`[8]Slack` へ `Webhook(HTTPS POST)` でレポートを`[9]私`に送信


項1のIFTTTと項9のSlackはあくまで例です。何らかの発火する概念と受け取る概念があるといいでしょう。IFTTTだと外出時でフックできます。仮置きしています。

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

### 概要


### 構成図

以下の赤枠部分を実装します。

TODO:

### 実装

#### データベースマイグレーション

実装の全体感は[こちら]()を参考にしてください。ポイントを以下に示します。

データベース設計。今回は一律Floatにしましたが、 **浮動小数点誤差を考慮するとDecimalが推奨** です。(記事を公開したら、マイグレーションします。。)

今回使うAPIは以下の2つです。電力量や各種センサーデータの格納をします。やることはシンプルで、[Nature Remo Cloud API](https://developer.nature.global/)を使って、`Nature Remo 3` `Nature Remo E Lite` のデータを定期的に取得し、データベースに書き込みます。

```bash
export NATURE_API_TOKEN="<APIトークン>"
```

#### 電力量の取得

```bash
curl -X GET "https://api.nature.global/1/appliances" -k --header "Authorization: Bearer $NATURE_API_TOKEN" | jq
```

```bash
curl -X GET "https://api.nature.global/1/appliances" -k --header "Authorization: Bearer $NATURE_API_TOKEN" | jq
```

NatureのAPIは、ECHONET Liteの仕様で一部値を返却します。Natureさんの[電力データ算出方法](https://developer.nature.global/docs/how-to-calculate-energy-data-from-smart-meter-values/)のドキュメントが非常に参考になりました。

[スマートメーターの各EPCの解説](https://developer.nature.global/docs/how-to-calculate-energy-data-from-smart-meter-values/#%E3%82%B9%E3%83%9E%E3%83%BC%E3%83%88%E3%83%A1%E3%83%BC%E3%82%BF%E3%83%BC%E3%81%AE%E5%90%84epc%E3%81%AE%E8%A7%A3%E8%AA%AC)をより、積算電力量計測値(正方向) `normal_direction_cumulative_electric_energy` と 積算電力量単位 `cumulative_electric_energy_unit` で乗算することで電力量(kWh)が求められます。実数部と単位を分けているのは浮動小数点誤差を考慮した設計によるものだと思われます。

https://github.com/shuntaka9576/smart-home/blob/52d3da74c0edad6424bea796eb341c4386438646/apps/smart-home-data-platform/src/domain/service/smart-meter-echonet-calculator.ts#L44-L69

今回はシンプルに乗算し、その他センサー値をNature Remo 3から取得し、Supabaseへ書き込みます。各種値にはISO8601の時刻がついているので、厳密な時間


### 確認


## センサーデータ配信実装


### 確認

本項でセンサーデータの配信ができるようになりました。


簡単なスクリプトを書いて、可視化してみた結果は以下の通りです。
TODO:


試しにProphetという時系列モデルで予測してもらった結果は以下の通りです。
TODO:


## MPCサーバーの実装

### 概要

データの配信ができるようになったので、このAPIをラップしてMCPサーバーを構築します。MCPについて解説します。

[MCP(Model Context Protocol)](https://modelcontextprotocol.io/introduction)は、LLMアプリケーションと外部データソースを連携するオープンプロトコルでAnthropicが仕様化しました。身近なところで、あらゆるエディタで補完や警告機能を出来るようにし、当時革命的だったLSP(Language Server Protocol)を参考にしてます。

MCPサーバーは別プロセスとして起動し、LLMアプリケーション内のMCPクライアントと `標準入出力` か `SSE` を使い通信します。メッセージフォーマットは、JSON-RPC 2.0を採用しており、LSPと同じです。

なぜ作ったのか？それは複数のLLMアプリケーション(Cloud DesktopやIDE(VSCode, IntelliJ))で、コンテキストの提供を共通化するためです。LSPがVSCode, Emacs, Vim, Neovim, IntelliJで同様に警告や補完機能を実現しているのと似ていますね！

今回MCPサーバー実装は、別のLLMアプリケーションと通信することを考慮し、外部依存が少なくなるようGoで実装しました[^1]。別のLLMアプリと通信しない場合、MCPサーバーの実装を、AIエージェント側に関数として実装するのが良いと思います。

[^1]: 今回はエコシステムを試す目的もあるのである種無理やりこのレイヤーを噛ませています。公式のSDKはPythonとTypeScriptなのでそちらを使った方が楽に実装できると思います。JSの場合、バンドルが可能ですが、Node自体に依存(ただ、NodeのSingle executable appやdeno compileだとランタイムが同梱されるため回避できます)。Pythonの場合、Pythonそのものとライブラリに依存
。シングルバイナリになるRustやZigなども良い選択肢だと思います。


### 構成図

以下の赤枠部分を実装します。

TODO:


### 実装

項. 電力量や各種センサーデータの配信で実装した`SMART_HOME_API_GATEWAY_DOMAIN` を使います。

```bash:.envを作成
cp .env.local .env
```

掲載のコードでは、v1まで必要です。
```bash:.env
SMART_HOME_API_GATEWAY_DOMAIN="https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/v1"
```

Goビルド時に引数で値を指定できます。この仕様にしたのは、リポジトリは公開したいが本REST APIは非公開としたかったためです。

```bash
make build
```

## Claude Desktop(with 作成したMCPサーバー)で分析してみる

### コンフィグの設定

Amazon APIGatwayのAPIキーがCDKで自動的に発行されているので、そちらを`mcpServers.smart-home-mcp-server.env.SMART_HOME_API_KEY`に記載してください。

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
        "SMART_HOME_API_KEY": "ss6sbQx2HA8JNdZv4Gzid13riZyA4mJsay3RqL2a"
      }
    }
  }
}
```



## 生成AIによる分析の実装

予想に必要な過去のセンサーデータ問い合わせの期間は、電気料金の明細データをDBに取り込めば実装側で算出可能ですが、そこそこ工数がかかるので明細データをプロンプトにしてLLM側に判断してもらいます。

:::message
センサーデータは12月14日からしかないことについて
:::




## 動作確認




## Tips

### Langsmithで解析

業務だとセルフホストできる`Langfuse`が人気だと思います。個人ユースだとLangsmithの無料枠は大きいのでじゃんじゃん使いましょう。




## さいごに

実はTEPCO Webで今回やっているような可視化と予測はWebサービスとして提供されています。偉大ですね。


その他書こうと思ったこととして、時系列モデル(Prophet)を使った電力量予測ネタを組み込みたかったのですが、記事のボリューム的に諦めました。別の記事で書こうと思います。

* AIエージェントとして機能としてブラッシュアップしたい
* MCPサーバーの機能として今回はToolsしか使ってないので、ResourceやPrompts、Samplingも実装しようと思います！

普段Pythonを書かないので、なかなか手間取りましたが、少し仲良くなれたらと思います！！


## 参考資料

脚注も合わせて様々な記事を参考にさせて頂きました。ありがとうございます。

* [AWS IoT と 生成 AI を使って自宅の消費電力を測定・予測してみよう](https://aws.amazon.com/jp/builders-flash/202411/forecast-house-power-consumption/)
* [Nature Remo E liteで、おうちの消費電力を見える化してみた](https://qiita.com/c60evaporator/items/4040040095aa58dcb5b1)
* [SlackにAPI経由でファイルをアップロードする(Python)](https://qiita.com/munaita_/items/97105648165f6a60442c)
* [Slackチャンネルにメッセージを投稿できるSlackAppを作成する](https://dev.classmethod.jp/articles/post-messages-to-slack-channel/)
