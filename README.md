
# SmartHome 🏠

## 構成図

![img](https://github.com/shuntaka9576/smart-home/blob/main/docs/spec-site/source/img/architecture.png)

## 環境作成

### 依存関係のインストール

```bash
uv sync
pnpm install
```

## AIアプリ

### .envの作成

`langsmith` で APIキーを取得して `.env` へ設定してください
```bash
cp apps/smart-home-ai-agent/.env.local apps/smart-home-ai-agent/.env.local
```

### 開発方法

アプリの起動
```bash
cd apps/smart-home-ai-agent
pnpm run dev
```

ローカルコンテナビルド
```bash
# リポジトリルートへ移動
docker buildx build -f apps/smart-home-ai-agent/Dockerfile . -t smart-home
docker run -p 8000:8000 -it $(docker images | grep "smart-home" | awk '{print $3}')
```


## データ基盤

### .envの作成

`smart-home-data-platform` `.env`を作成し、設定を行う。`DATABASE_URL`は後述。

```bash
cp apps/smart-home-data-platform/.env.local apps/smart-home-data-platform/.env
```

### データベースの用意

#### Supabaseの操作

Supabase上でプロジェクトを作成すると、DBのパスワードが発行されます。接続情報を元にホストマシンから接続。以下の接続先があり `Session pooler` のエンドポイントを使う。

* Direct connection
* Transaction pooler
* Session pooler <- を使う

セッションに入れることを確認。今回データベースはデフォルトの `postgres` を使うこととする。
```bash
psql "postgresql://postgres.<endpoint>:<password>J@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

#### スキーマのマイグレーション実施

先ほsmart-home-data-platformの`.env` に `DATABASE_URL` を設定

```bash:.env
DATABASE_URL="postgresql://postgres.<endpoint>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

```bash:スキーマのデプロイ
cd apps/smart-home-data-platform


pnpm prisma generate
pnpm prisma migrate dev --name init
```

### CloudFormationのデプロイ

```bash
npx cdk deploy -c env="dev" dev-smart-home-stack
npx cdk deploy -c env="dev" dev-smart-home-stack > /dev/null 2>&1
```

センサーデータ配信API
```bash
export SMART_HOME_API_KEY=""
export SMART_HOME_API_GATEWAY_DOMAIN="" # https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/v1 まで含める

curl -X GET \
  -H "Accept: application/json" \
  -H "x-api-key: $SMART_HOME_API_KEY" \
  "$SMART_HOME_API_GATEWAY_DOMAIN/home-condition"

curl -X GET \
  -H "Accept: application/json" \
  -H "x-api-key: $SMART_HOME_API_KEY" \
  "$SMART_HOME_API_GATEWAY_DOMAIN/home-condition?since=2024-12-12%2000:00&until=2024-12-01%2000:00"
```

レポート生成API
```bash
export AI_AGENT_LAMBDA_FUNCTION_URL=""

curl -X POST \
$AI_AGENT_LAMBDA_FUNCTION_URL/electric-energy-report
```
