# リファクタ実行計画 (2026-08-03)

## ゴール

- pnpm workspace を解体し単一パッケージにする
- `src/entrypoints/` + `src/lib/` (フラット、接頭辞で束ねる) 構成に移行する
- chrome 側に漏れている純粋ロジックを `*.core.ts` に抽出しテストを付ける
- パレット2実装 (tab-switcher / bookmark) の約440行の重複を統一機械で解消する

## 非ゴール

- 挙動の変更 (全ステップで既存の操作感を維持する)
- blocking 書き込みの background 一元化 (未決のまま。やるなら本計画完了後に別途)
- features / ui / infrastructure 等の層分割、境界チェックスクリプト (必要になったら後から足す)

## 規約 (移行後に効くルール)

1. 純粋なファイルは `<名前>.core.ts` と命名し、`tsconfig.pure.json` (include: `src/**/*.core.ts` と `src/**/*.core.test.ts`、lib: ES2022 / types: []) で機械検査する
2. entrypoints は合成・配線のみ。実装はすべて lib
3. lib はフラット。同じ機能のファイルは接頭辞 (`block.` `hint.` 等) で束ね、ls のアルファベット順を機能グルーピングとして使う。ファイル数が60を超えて手狭になったら接頭辞グループのディレクトリ昇格を検討する

## ファイル対応表

### packages/core/src → src/lib/

| 現在 | 移行後 |
|---|---|
| key.ts | keys.core.ts |
| keybind.ts + keybind-matcher.ts (+test) | keybinds.core.ts (+ keybinds.core.test.ts) に統合 |
| tab.ts (TabSummary) | tabs.core.ts |
| tab-switcher.ts (+test) | tab-switcher.core.ts (+ tab-switcher.core.test.ts) |
| bookmark.ts + bookmark-navigator.ts (+test) | bookmarks.core.ts (+ bookmarks.core.test.ts) に統合 |
| filter.ts (+test) | palette.core.ts (+ palette.core.test.ts) |
| hint.ts (+test) | hint.core.ts (+ hint.core.test.ts) |
| block.ts (+test) | block.core.ts (+ block.core.test.ts) |
| index.ts (バレル) | 削除。直接 import に置換 |
| extensionName | entrypoints/background/index.ts に吸収 |

### packages/chrome/src → src/

| 現在 | 移行後 |
|---|---|
| content.ts | entrypoints/content/index.ts |
| actions.ts | entrypoints/content/actions.ts |
| background.ts | entrypoints/background/index.ts |
| dev-reload.ts | entrypoints/background/dev-reload.ts |
| options.ts | entrypoints/options/index.ts (Step 6 で view を lib へ) |
| blocked.ts | entrypoints/blocked/index.ts (同上) |
| keyboard.ts | lib/keys.to-key.ts |
| tabs.ts | lib/tabs.gateway.ts |
| messaging.ts | タブ系 → lib/tabs.client.ts、listBookmarks → lib/bookmarks.client.ts |
| messages.ts | 契約型を lib/tabs.core.ts と lib/bookmarks.core.ts に分割 |
| tab-switcher-ui.ts | lib/tab-switcher.view.ts |
| bookmark-ui.ts | lib/bookmarks.view.ts |
| palette.css | lib/palette.css |
| hint-ui.ts | lib/hint.view.ts |
| hint.css | lib/hint.css |
| scroller.ts | lib/scroll.driver.ts (Step 5 で物理を scroll.core.ts へ) |
| blocking.ts | lib/block.gateway.ts (Step 3 で遷移を block.core.ts へ) |
| block-storage.ts | lib/block.storage.ts (Step 3 で parse を block.core.ts へ) |
| dom.ts | lib/dom.ts (汎用ヘルパーなので接頭辞なし) |
| env.d.ts | src/env.d.ts |

### public / 設定ファイル

| 現在 | 移行後 |
|---|---|
| packages/chrome/public/options.html | src/entrypoints/options/index.html |
| packages/chrome/public/blocked.html | src/entrypoints/blocked/index.html |
| packages/chrome/public/manifest.json, page.css | public/ (root へ移動、名前維持) |
| packages/chrome/build.mjs | build.mjs (root) |
| packages/*/package.json, pnpm-workspace.yaml | 削除。依存は root package.json へ統合 |
| packages/*/tsconfig.json | tsconfig.json (lib DOM+chrome) + tsconfig.pure.json (root) |

## ステップ

各ステップの終わりに検証してからコミットする。1ステップ = 1コミットを基本とし、Step 3 のみ項目ごとにコミットを分ける。

### Step 0: ベースライン

現状で `pnpm build && pnpm typecheck && pnpm test` が通ることと、手動スモーク (下記チェックリスト) を確認しておく。

### Step 1: workspace 解体 (機械的移動のみ)

- packages/chrome/src/* → src/、packages/core/src/* → src/core/ (この時点では旧ファイル名のまま)
- `@vios/core` import を相対パスに置換。バレルは src/core/index.ts として一時存続
- build.mjs / public を root へ。package.json 統合 (@types/chrome, esbuild を root devDeps へ)、pnpm-workspace.yaml 削除
- tsconfig を root 1枚に (lib DOM+chrome。純粋検査は Step 2 から)
- 検証: build / typecheck / test / スモーク

### Step 2: entrypoints / lib へ再配置 (機械的移動のみ)

- 上の対応表どおりに git mv + import 書き換え。ファイル統合 (keybind+matcher 等) と messages/messaging の分割はこのステップで行うが、ロジックは一切変えない
- バレル削除、直接 import へ
- build.mjs: entryPoints を `src/entrypoints/*/index.ts`、`entryNames: '[dir]'` 追加、`entrypoints/*/index.html` → `dist/<name>.html` コピーを追加
- tsconfig.pure.json 追加。typecheck スクリプトを2枚検査に変更
- 検証: build / typecheck / test / スモーク全項目。dist の出力名が変わっていないこと (manifest 無修正で動くこと) を確認

### Step 3: 純粋ロジック抽出 (挙動維持、項目ごとにコミット+テスト追加)

1. BlockState 遷移 (add / remove / unlock / reblock、unlockDurationMs) → block.core.ts。options.ts と block.gateway.ts の重複遷移を統一
2. parseBlockState → block.core.ts
3. DNR ルール構築 (ドメイン配列 → ルール配列) → block.core.ts
4. bookmarks のツリー flatten (walk) → bookmarks.core.ts (ノード型は構造的に定義)
5. keyup 解放判定 → keybinds.core.ts

### Step 4: パレット統一

1. API 設計: view model + effect 方式の型スケッチを提示し合意を取る (effect の語彙、タブ固有挙動の注入方法、検索モードの表現)
2. palette.core.ts に統一機械を実装 + テスト
3. tab-switcher を統一機械 + palette.view.ts に置換
4. bookmarks を同様に置換
5. 旧 createTabSwitcher / createBookmarkNavigator と旧 view の重複コードを削除
- 検証はパレット操作の全パターン (スモーク t / b の項目)

### Step 5: scroll 物理の core 化

- `step(model, input) → { model, command }` 形式で scroll.core.ts へ抽出 + テスト (指数平滑・hold 速度積分・far-jump・外部スクロール検出)
- scroll.driver.ts は rAF / scrollTo / matchMedia のみに
- 検証はスクロールの手動確認を重点的に (ホールド開始 150ms、far-jump、reduce-motion)

### Step 6: options / blocked の view を lib へ

- entrypoints/options/index.ts から一覧描画・確認モーダルを lib/block.options-view.ts へ、blocked は lib/block.blocked-view.ts へ
- entrypoints は配線だけになる

## 手動スモークチェックリスト

- スクロール: j / k (単発・ホールド)、d / u、gg / G (far-jump)、reduce-motion 時は即時
- h / l で履歴、r でリロード
- t: モーダル表示、j / k 選択、数字ジャンプ、/ 検索 (Enter 1件即決定・Esc クリア)、x でタブを閉じて一覧更新、n で新規タブ、Esc / blur で閉じる
- f: ヒント表示、ラベル入力で絞り込み、input は focus・リンクは click
- b: ブックマークパレット、Shift+Enter で新規タブ
- ブロック: options でドメイン追加 (開いているタブがあれば確認モーダル→強制クローズ)、ブロックページ表示、`unlock <domain>` で1時間解除、アラームで再ブロック、options から削除
- dev: `pnpm dev` で watch リロードが機能すること
