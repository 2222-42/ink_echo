<!-- ドキュメント間相互参照 -->
**関連ドキュメント**
- [要件（何を満たすべきか） → requirements.md](./requirements.md)
- [設計（どう実現するか） → design.md](./design.md)

**このドキュメントの変更が生じた場合**
- requirements.md を変更 → 本ファイルの対応箇所を修正
- 本ファイルを変更 → design.md を確認・修正

# Ink Echo - Specification  
（requirements.mdの条件を体系的に整理・明文化したもの）

## 1. システムの目的と哲学的制約
- <a id="SPEC-01"></a>**[SPEC-01]** 本システムは、ユーザーの主体性を最優先し、AIが最終的な思考のアウトプットを代行しない *(要件: [REQ-28](./requirements.md#REQ-28))*
- <a id="SPEC-02"></a>**[SPEC-02]** 最終アウトプットは必ずアナログ（手書き + Zettelkastenへの物理的格納）でなければならない *(要件: [REQ-10](./requirements.md#REQ-10), [REQ-12](./requirements.md#REQ-12))*
- <a id="SPEC-03"></a>**[SPEC-03]** AIは問い返し・解析・提案の下働きに徹し、ユーザーが自分で決め、自分で書くことを強制する *(要件: [REQ-05](./requirements.md#REQ-05))*
- <a id="SPEC-04"></a>**[SPEC-04]** デジタル依存を助長せず、むしろアナログ回帰を促すことが最優先の価値基準である

## 2. 対話サイクルの仕様
### 2.1 入力サイクル
- <a id="SPEC-05"></a>**[SPEC-05]** ユーザーの音声入力を受け付ける *(要件: [REQ-01](./requirements.md#REQ-01))*
- <a id="SPEC-06"></a>**[SPEC-06]** 音声をリアルタイムまたは録音後にSpeech-to-Textでテキストに変換する *(要件: [REQ-02](./requirements.md#REQ-02))*
- <a id="SPEC-07"></a>**[SPEC-07]** 変換テキストをMistral APIに送信し、理解・処理させる *(要件: [REQ-03](./requirements.md#REQ-03))*

### 2.2 問い返し生成ルール
- <a id="SPEC-08"></a>**[SPEC-08]** Mistralの応答は以下のスタイルを必ず満たす *(要件: [REQ-04](./requirements.md#REQ-04), [REQ-05](./requirements.md#REQ-05))*
  - 応答は英語で、**厳密に1文のみ**の短い質問とする。説明、直接的な指摘、批判、提案、示唆は一切禁止。
  - Newsletter風の穏やかで共感的な口調（柔らかい比喩や日常語）を使い、ユーザーの主体性を促す。
  - トレードオフやスタート地点を暗に振り返らせる意図を、質問の形で暗示する。
  - 完璧主義やデジタル依存について、ユーザー自身に優しく疑問を抱かせる質問にする。
  - Doomer的思考に対しては「終末は勝手に来る。望むな、備えろ」という前提を暗に反映し、備えを促す質問にする。
  - 最終アウトプットは手書きであるべきだという方針を、質問を通じてユーザー自身が気づき書くように仕向ける。
- <a id="SPEC-09"></a>**[SPEC-09]** 応答文は声で自然に読み上げられ、一瞬で聞き取れるよう、**英語で100文字以内を最優先、理想50〜80文字**とする *(要件: [REQ-06](./requirements.md#REQ-06))*

### 2.3 ターン制限と強制終了
- <a id="SPEC-10"></a>**[SPEC-10]** 1セッション内の対話ターン数を最大7ターンに制限する *(要件: [REQ-08](./requirements.md#REQ-08))*
- <a id="SPEC-11"></a>**[SPEC-11]** 7ターン目に達した場合、即座に対話を終了する *(要件: [REQ-09](./requirements.md#REQ-09))*
- <a id="SPEC-12"></a>**[SPEC-12]** 終了時には決められた固定メッセージをElevenLabsで音声再生する *(要件: [REQ-10](./requirements.md#REQ-10))*
  - メッセージ内容：「これ以上話しても、あなたが紙に書かないと何も変わらない。今、ここで重要な気づきを1枚のカードに手書きでまとめて。書いてから写真をアップロードしてね。それがなければ続きはないよ。」
- <a id="SPEC-13"></a>**[SPEC-13]** 終了後、マイク入力を即座に無効化する *(要件: [REQ-11](./requirements.md#REQ-11))*

### 2.4 写真アップロードと再開
- <a id="SPEC-14"></a>**[SPEC-14]** ユーザーが手書きカードの画像をアップロードできるUIを提供する *(要件: [REQ-12](./requirements.md#REQ-12))*
- <a id="SPEC-15"></a>**[SPEC-15]** アップロード画像をMistral Vision APIに送信し、以下の解析を必須とする *(要件: [REQ-13](./requirements.md#REQ-13), [REQ-14](./requirements.md#REQ-14), [REQ-15](./requirements.md#REQ-15), [REQ-16](./requirements.md#REQ-16))*
  - 手書き文字の読み取り
  - 主要キーワード・テーマの抽出（3〜5個）
  - 前回までの対話履歴との関連性・リンク候補の提案（1〜2個）
- <a id="SPEC-16"></a>**[SPEC-16]** 解析結果を基に、次の問い返し文を生成する *(要件: [REQ-17](./requirements.md#REQ-17))*
- <a id="SPEC-17"></a>**[SPEC-17]** 再開時の初回応答として、肯定的なフィードバックを声で伝える *(要件: [REQ-18](./requirements.md#REQ-18))*
  - 例：「このカード、素晴らしい。では続きを始めよう。でもまた7ターンで区切るよ。」
- <a id="SPEC-18"></a>**[SPEC-18]** 再開後はターンカウントをリセットして0に戻し、最初から7ターンの新しいセッションとして継続する（画像の再評価など連続性を確保しつつも、区切りをつけるため） *(要件: [REQ-19](./requirements.md#REQ-19), [REQ-20](./requirements.md#REQ-20))*

## 3. 音声演出の仕様
- <a id="SPEC-19"></a>**[SPEC-19]** 通常の問い返し：穏やか・共感的トーン（ElevenLabs stability 0.5〜0.7, style 0.3〜0.5） *(要件: [REQ-21](./requirements.md#REQ-21))*
- <a id="SPEC-20"></a>**[SPEC-20]** ターン後半（5〜7ターン目）：少し真剣・鋭いトーンにシフト（stability 0.45, style 0.55程度） *(要件: [REQ-22](./requirements.md#REQ-22))*
- <a id="SPEC-21"></a>**[SPEC-21]** 強制終了メッセージ：静かだが力強く、逃げ場のない印象を与えるトーン（stability 0.4, style 0.7程度） *(要件: [REQ-23](./requirements.md#REQ-23))*

## 4. データ・状態管理の仕様
- <a id="SPEC-22"></a>**[SPEC-22]** 対話履歴はセッション単位で保持する *(要件: [REQ-20](./requirements.md#REQ-20))*
- <a id="SPEC-23"></a>**[SPEC-23]** MVPではクライアントサイド（localStorage / sessionStorage）のみで管理する *(要件: [REQ-26](./requirements.md#REQ-26))*
- <a id="SPEC-24"></a>**[SPEC-24]** サーバーへの永続保存は行わない *(要件: [REQ-26](./requirements.md#REQ-26))*
- <a id="SPEC-25"></a>**[SPEC-25]** セッションIDを生成し、同一ブラウザ内での再開を可能とする *(要件: [REQ-20](./requirements.md#REQ-20))*

## 5. 非機能要件の仕様
- <a id="SPEC-26"></a>**[SPEC-26]** ブラウザ単体で動作するWebアプリケーションとする *(要件: [REQ-24](./requirements.md#REQ-24))*
- <a id="SPEC-27"></a>**[SPEC-27]** インターネット接続が必須である *(要件: [REQ-25](./requirements.md#REQ-25))*
- <a id="SPEC-28"></a>**[SPEC-28]** 対話内容はサーバーに永続的に保存しない *(要件: [REQ-26](./requirements.md#REQ-26))*
- <a id="SPEC-29"></a>**[SPEC-29]** ブラウザを閉じた場合、セッション状態は消去される（MVP仕様） *(要件: [REQ-27](./requirements.md#REQ-27))*

## 6. 将来拡張のための仕様指針（MVPでは実装しないが設計上満たすべき制約）
- <a id="SPEC-30"></a>**[SPEC-30]** ユーザー同意に基づくオプトインでのみ永続保存を行う *(要件: [REQ-28](./requirements.md#REQ-28), [REQ-29](./requirements.md#REQ-29))*
- <a id="SPEC-31"></a>**[SPEC-31]** 保存先はサーバーレスDB（Cloudflare D1 / Supabase / Vercel Postgres）を想定 *(要件: [REQ-30](./requirements.md#REQ-30))*
- <a id="SPEC-32"></a>**[SPEC-32]** 保存データは暗号化する *(要件: [REQ-31](./requirements.md#REQ-31))*
- <a id="SPEC-33"></a>**[SPEC-33]** 複数デバイス間でのセッション引き継ぎを可能とする *(要件: [REQ-32](./requirements.md#REQ-32))*
- <a id="SPEC-34"></a>**[SPEC-34]** カードのバージョン管理・全文検索を将来追加可能とする *(要件: [REQ-33](./requirements.md#REQ-33))*
- <a id="SPEC-35"></a>**[SPEC-35]** 匿名共有URLによるカード公開機能を追加可能とする *(要件: [REQ-34](./requirements.md#REQ-34))*

## 7. プロダクト自己改善関連（MCPサーバー・W&B Weave統合）の仕様指針
- <a id="SPEC-36"></a>**[SPEC-36]** 改善データは完全にオプトインかつ匿名化されたデータのみを使用し、ハッカソン終了までの保持期間と明確な削除ポリシーを設けること *(要件: [REQ-35](./requirements.md#REQ-35), [REQ-37](./requirements.md#REQ-37), [REQ-42](./requirements.md#REQ-42))*
- <a id="SPEC-37"></a>**[SPEC-37]** Weights & Biases Weaveを活用し、Trace・Evaluation・Prompt最適化ループを実現可能とする。MCP利用時はMistral API呼び出しのトレースや評価メトリクス（満足度・行動変容率）の追跡を考慮する *(要件: [REQ-36](./requirements.md#REQ-36), [REQ-38](./requirements.md#REQ-38))*
- <a id="SPEC-38"></a>**[SPEC-38]** 改善対象は「問い返しの深さ」「主体性促進度」「声トーン適合度」等とし、Weave Evaluationsを用いた自動評価やプロンプト最適化を想定する *(要件: [REQ-38](./requirements.md#REQ-38))*
- <a id="SPEC-39"></a>**[SPEC-39]** ユーザー体験への還元として、Weaveダッシュボードの可視化と連動した音声メタフィードバック（「君の声が…」等）を想定する *(要件: [REQ-39](./requirements.md#REQ-39))*
- <a id="SPEC-40"></a>**[SPEC-40]** 将来的にMCPサーバーとしてツール公開する際は、プロジェクトをW&Bアカウントにリンクし、Weave統合を必須として全機能呼び出しを自動トレース・ハッカソン審査基準に基づく最適化を行う *(要件: [REQ-40](./requirements.md#REQ-40), [REQ-41](./requirements.md#REQ-41))*