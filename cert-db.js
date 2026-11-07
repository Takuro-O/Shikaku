// 資格データベース（合格ナビ）
// ------------------------------------------------------------
// 資格・手当の一覧と、それを扱う関数をまとめたファイルです。
// 制度の改定や資格の追加・廃止は、このファイルだけを編集すれば反映されます。
//   - 資格の追加・変更: CERTS_SPECIAL / CERTS_SELF / CERTS_MS / CERTS_SNOW
//   - 手当額の変更:     PAYMENT_MASTER
//   - 特別措置の期限:   MS_REVIEW_DATE / SNOW_PERIOD_END
// index.html より先に読み込まれます（グローバルに CERT_DB などを公開します）。
// ------------------------------------------------------------
// === 資格データベース（PDFを完全網羅） ====================
// ============================================================
// 資格データベース（2026年02月改訂版）
// PDFの全資格を網羅。program × group × seriesで分類。
// ============================================================

// 制度（program）
//   special  : 専門技能手当（月額支給）
//   self     : 自己啓発支援金（合格時一時金）
//   ms       : Microsoft特別措置（専門技能手当・5年期限撤廃あり）
//   snow     : ServiceNow特別措置（自己啓発支援金）
//
// 区分（group）
//   special: '1','2','3','4'   → 月3万/2万/1万/5千円
//   self:    'A','B','C','D'   → 5万/3万/1万/受験料のみ
//   ms:      '1','2','3','4'   → 月3万/2万/1万/5千円（特別措置で5年期限撤廃）
//   snow:    特別な料金体系（一時金）

// ─── 月額/一時金マスター ─────────────────────────────────────
const PAYMENT_MASTER = {
  special: { '1': { monthly: 30000, label: '月額 3万円' },
             '2': { monthly: 20000, label: '月額 2万円' },
             '3': { monthly: 10000, label: '月額 1万円' },
             '4': { monthly:  5000, label: '月額 5千円' } },
  self:    { 'A': { onetime: 50000, label: '一時金 5万円' },
             'B': { onetime: 30000, label: '一時金 3万円' },
             'C': { onetime: 10000, label: '一時金 1万円' },
             'D': { onetime:     0, label: '受験料のみ' } },
  ms:      { '1': { monthly: 30000, label: '月額 3万円' },
             '2': { monthly: 20000, label: '月額 2万円' },
             '3': { monthly: 10000, label: '月額 1万円' },
             '4': { monthly:  5000, label: '月額 5千円' } },
};

// ─── 専門技能手当（通常） ─────────────────────────────────────
const CERTS_SPECIAL = [
  // 1群（月3万円）
  { name: 'システム監査', group: '1', series: '情報処理技術者' },
  { name: 'ITストラテジスト', group: '1', series: '情報処理技術者' },
  { name: 'エバンジェリスト', group: '1', series: 'IT検証技術者' },
  { name: 'ITコーディネータ', group: '1', series: 'ITコーディネータ' },
  { name: 'CCBA', group: '1', series: 'コンサルタント(IIBA)' },
  { name: 'CBAP', group: '1', series: 'コンサルタント(IIBA)' },
  { name: 'SAP Certified Professional', group: '1', series: 'SAP' },
  { name: '公認会計士', group: '1', series: '業務系' },
  { name: '税理士', group: '1', series: '業務系' },
  { name: '中小企業診断士', group: '1', series: '業務系' },
  { name: 'プロジェクトマネージャ', group: '1', series: '情報処理技術者' },
  { name: 'CCIE', group: '1', series: 'シスコ' },

  // 2群（月2万円）
  { name: 'システムアーキテクト', group: '2', series: '情報処理技術者' },
  { name: 'ITサービスマネージャ', group: '2', series: '情報処理技術者' },
  { name: 'AWS アーキテクト プロフェッショナル認定資格', group: '2', series: 'AWS' },
  { name: 'AWS DevOps エンジニア プロフェッショナル認定資格', group: '2', series: 'AWS' },
  { name: 'PMP', group: '2', series: 'PMI' },
  { name: 'Expert認定資格', group: '2', series: 'SAP' },
  { name: '教育情報化コーディネーター2級', group: '2', series: '教育情報化コーディネーター' },
  { name: 'ネットワークスペシャリスト', group: '2', series: '情報処理技術者' },
  { name: 'エンベデッドシステムスペシャリスト', group: '2', series: '情報処理技術者' },
  { name: 'Advanced Networking 専門知識資格', group: '2', series: 'マイクロソフト' },
  { name: '情報処理安全確保支援士（許可制）', group: '2', series: '情報処理技術者' },
  { name: 'データベーススペシャリスト', group: '2', series: '情報処理技術者' },
  { name: 'Security 専門知識資格', group: '2', series: 'マイクロソフト' },

  // 3群（月1万円）
  { name: '応用情報技術者', group: '3', series: '情報処理技術者' },
  { name: '基本情報技術者', group: '3', series: '情報処理技術者' },
  { name: 'デザイナー', group: '3', series: 'IT検証技術者' },
  { name: 'オラクル ゴールド', group: '3', series: 'オラクル' },
  { name: 'CCNP', group: '3', series: 'シスコ' },
  { name: 'AWS アソシエイト認定資格', group: '3', series: 'AWS' },
  { name: 'SAP Certified Associate（Sourcing and Procurement）', group: '3', series: 'SAP' },
  { name: 'ICT支援員上級認定試験', group: '3', series: '教育情報化コーディネーター' },

  // 4群（月5千円）※下位資格枠（同系列の1〜3群取得時に支給終了）
  // 公式リストに4群の固有名は明示なし。記載は省略。
];

// ─── 自己啓発支援金 ─────────────────────────────────────────
const CERTS_SELF = [
  // A群（一時金5万円）
  { name: '固体力学解析技術 上級アナリスト', group: 'A', series: 'CAE' },
  { name: '熱流体力学解析技術 上級アナリスト', group: 'A', series: 'CAE' },
  { name: 'CAD利用技術1級（機械）', group: 'A', series: 'CAD' },
  { name: '振動分野解析技術 上級アナリスト', group: 'A', series: 'CAE' },
  { name: 'CAD利用技術1級（建築）', group: 'A', series: 'CAD' },
  { name: '計算力学 固体力学1級', group: 'A', series: 'CAE' },
  { name: 'OCRES アドバンスト', group: 'A', series: 'UML' },
  { name: 'シニアモバイルシステムコンサルタント', group: 'A', series: 'MCPC' },
  { name: 'CAD利用技術1級（トレース）', group: 'A', series: 'CAD' },
  { name: '計算力学 熱流体力学1級', group: 'A', series: 'CAE' },
  { name: 'PHP上級', group: 'A', series: 'PHP' },
  { name: 'OCUP アドバンスト', group: 'A', series: 'UML' },
  { name: 'モバイルシステム1級', group: 'A', series: 'MCPC' },
  { name: 'LPIC/LinuC レベル3', group: 'A', series: 'LPI' },
  { name: 'OSS-DB Gold', group: 'A', series: 'LPI' },
  { name: 'CAE L4', group: 'A', series: 'CAE' },
  { name: '3次元CAD利用技術1級', group: 'A', series: 'CAD' },
  { name: '計算力学 振動分野1級', group: 'A', series: 'CAE' },
  { name: '英検準1級', group: 'A', series: '英検' },
  { name: '日商簿記1級', group: 'A', series: '日商簿記' },
  { name: 'TOEIC 850点以上', group: 'A', series: 'TOEIC' },
  { name: 'IoTシステム技術検定1級', group: 'A', series: 'IoT' },
  { name: 'IoT検定1級', group: 'A', series: 'IoT' },
  { name: 'プロフェッショナルCFO', group: 'A', series: '経理・財務(JACFO)' },

  // B群（一時金3万円）
  { name: '計算力学 固体力学2級', group: 'B', series: 'CAE' },
  { name: 'Java EE 7 Application Developer', group: 'B', series: 'JAVA' },
  { name: 'SAP Certified Associate（Sales）', group: 'B', series: 'SAP' },
  { name: 'OPCEL', group: 'B', series: 'LPI' },
  { name: 'Security+', group: 'B', series: 'CompTIA' },
  { name: '3次元CAD利用技術 準1級', group: 'B', series: 'CAD' },
  { name: '計算力学 熱流体力学2級', group: 'B', series: 'CAE' },
  { name: '認定 Tableauデータアナリスト', group: 'B', series: 'Salesforce' },
  { name: 'オラクル シルバー', group: 'B', series: 'オラクル' },
  { name: 'OCJP Gold', group: 'B', series: 'JAVA' },
  { name: 'CCNA', group: 'B', series: 'シスコ' },
  { name: 'SAP Specialty認定資格', group: 'B', series: 'SAP' },
  { name: 'PMI Associate認定資格', group: 'B', series: 'PMI' },
  { name: 'SAP Certified Associate (Developer)', group: 'B', series: 'SAP' },
  { name: 'PHP準上級', group: 'B', series: 'PHP' },
  { name: 'UMLレベル2', group: 'B', series: 'UML' },
  { name: 'CAE中級', group: 'B', series: 'CAE' },
  { name: 'CADクラス1グレードA', group: 'B', series: 'CAD' },
  { name: 'LPIC/LinuC レベル2', group: 'B', series: 'LPI' },
  { name: 'OSS-DB Silver', group: 'B', series: 'LPI' },
  { name: 'CAE L3', group: 'B', series: 'CAE' },
  { name: 'OCRES インターメディエイト', group: 'B', series: 'UML' },
  { name: 'Server+', group: 'B', series: 'CompTIA' },
  { name: 'CAD利用技術2級', group: 'B', series: 'CAD' },
  { name: '計算力学 振動分野2級', group: 'B', series: 'CAE' },
  { name: '英検2級', group: 'B', series: '英検' },
  { name: '認定上級アドミニストレーター', group: 'B', series: 'Salesforce' },
  { name: '認定上級Platformデベロッパー', group: 'B', series: 'Salesforce' },
  { name: '認定TableauServerアドミニストレーター', group: 'B', series: 'Salesforce' },
  { name: 'Microsoft Expert (E資格)', group: 'B', series: 'マイクロソフト' },
  { name: 'TOEIC 750点以上', group: 'B', series: 'TOEIC' },
  { name: '日商簿記準1級', group: 'B', series: '日商簿記' },
  { name: 'スタンダードCFO', group: 'B', series: '経理・財務(JACFO)' },
  { name: 'メンタルヘルス・マネジメント検定 Ⅰ種（マスター）', group: 'B', series: 'メンタルヘルス' },
  { name: '認定 Sales Cloudコンサルタント', group: 'B', series: 'Salesforce' },
  { name: '認定Platformアプリケーションビルダー', group: 'B', series: 'Salesforce' },
  { name: '認定 Service Cloudコンサルタント', group: 'B', series: 'Salesforce' },
  { name: '認定Platformデベロッパー', group: 'B', series: 'Salesforce' },
  { name: 'Specialist認定', group: 'B', series: 'Salesforce' },
  { name: 'ハラスメント相談員', group: 'B', series: 'ハラスメント' },

  // C群（一時金1万円）
  { name: 'IT検証技術者 テスター', group: 'C', series: 'IT検証技術者' },
  { name: 'オラクル ブロンズ', group: 'C', series: 'オラクル' },
  { name: 'OCJP Silver', group: 'C', series: 'JAVA' },
  { name: 'SAP Fundamentals認定資格', group: 'C', series: 'SAP' },
  { name: 'PMI 基礎認定資格', group: 'C', series: 'PMI' },
  { name: 'SAP Associate レベル1', group: 'C', series: 'SAP' },
  { name: 'CADクラス1 グレードB', group: 'C', series: 'CAD' },
  { name: 'CADクラス1 グレードC', group: 'C', series: 'CAD' },
  { name: 'LPIC/LinuC レベル1', group: 'C', series: 'LPI' },
  { name: 'CAE L2', group: 'C', series: 'CAE' },
  { name: 'OCUP インターメディエイト', group: 'C', series: 'UML' },
  { name: 'Network+', group: 'C', series: 'CompTIA' },
  { name: 'ADVANCEモバイルシステム2級', group: 'C', series: 'MCPC' },
  { name: '3次元CAD利用技術2級', group: 'C', series: 'CAD' },
  { name: '英検3級', group: 'C', series: '英検' },
  { name: '認定エキスパート', group: 'C', series: 'Salesforce' },
  { name: '認定アドミニストレーター', group: 'C', series: 'Salesforce' },
  { name: '認定JavaScriptデベロッパー', group: 'C', series: 'Salesforce' },
  { name: '認定Tableau Desktop', group: 'C', series: 'Salesforce' },
  { name: 'Microsoft 基礎Professional（AZ-900）', code: 'AZ-900', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（SC-900）', code: 'SC-900', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（AI-900）', code: 'AI-900', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（MS-900）', code: 'MS-900', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（DP-900）', code: 'DP-900', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（PL-900）', code: 'PL-900', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（MB-910）', code: 'MB-910', group: 'C', series: 'マイクロソフト' },
  { name: 'Microsoft 基礎Professional（MB-920）', code: 'MB-920', group: 'C', series: 'マイクロソフト' },
  { name: '日商簿記Ｂ級', group: 'C', series: '日商簿記' },
  { name: '日商簿記2級', group: 'C', series: '日商簿記' },
  { name: 'AWS Professional検定', group: 'C', series: 'AWS' },
  { name: 'TOEIC 650点以上', group: 'C', series: 'TOEIC' },
  { name: 'IoTシステム技術検定2級', group: 'C', series: 'IoT' },
  { name: 'IoT検定2級', group: 'C', series: 'IoT' },
  { name: 'FASS レベルＣ', group: 'C', series: '経理・財務(JACFO)' },
  { name: 'ビジネス会計検定2級', group: 'C', series: 'ビジネス会計検定' },
  { name: 'メンタルヘルス・マネジメント検定 Ⅱ種（ラインケア）', group: 'C', series: 'メンタルヘルス' },
  { name: 'ハラスメントマネージャー', group: 'C', series: 'ハラスメント' },

  // D群（受験料のみ）
  { name: 'ITパスポート', group: 'D', series: '情報処理技術者' },
  { name: '情報セキュリティマネジメント', group: 'D', series: '情報処理技術者' },
  { name: '教育情報化コーディネーター3級', group: 'D', series: '教育情報化コーデイネータ' },
  { name: 'データサイエンティスト検定アシスタント', group: 'D', series: '統計検定' },
  { name: 'OCJP Bronze', group: 'D', series: 'JAVA' },
  { name: 'ICT支援員認定試験', group: 'D', series: '教育情報化コーデイネータ' },
  { name: 'PHP初級', group: 'D', series: 'PHP' },
  { name: 'UML基礎', group: 'D', series: 'UML' },
  { name: 'CADクラス2 グレードA', group: 'D', series: 'CAD' },
  { name: 'CAE L1', group: 'D', series: 'CAE' },
  { name: 'OCUP ファンダメンタル', group: 'D', series: 'UML' },
  { name: 'A+', group: 'D', series: 'CompTIA' },
  { name: 'ITIL ファンデーション', group: 'D', series: 'ITIL' },
  { name: 'CAD利用技術基礎', group: 'D', series: 'CAD' },
  { name: '英検4級', group: 'D', series: '英検' },
  { name: 'AWS アソシエイト（Associate）', group: 'D', series: 'AWS' },
  { name: 'G検定（ジェネラリスト検定）', group: 'D', series: 'JDLA認定資格' },
  { name: '生成AIパスポート', group: 'D', series: 'JDLA認定資格' },
  { name: 'CompTIA C級', group: 'D', series: 'CompTIA' },
  { name: '日商簿記3級', group: 'D', series: '日商簿記' },
  { name: 'SAP Standard資格', group: 'D', series: 'SAP' },
  { name: 'ビジネス会計検定3級', group: 'D', series: 'ビジネス会計検定' },
  { name: 'メンタルヘルス・マネジメント検定 Ⅲ種（セルフケア）', group: 'D', series: 'メンタルヘルス' },
  { name: 'RPA技術者検定', group: 'D', series: 'RPA' },
  { name: 'IMA（Internet Marketing Analyst）', group: 'D', series: 'マーケティング' },
  { name: 'マーケティング・ビジネス実務検定', group: 'D', series: 'マーケティング' },
  { name: 'ビジネスキャリア検定', group: 'D', series: 'ビジネスキャリア' },
  { name: 'JDLA認定資格', group: 'D', series: 'JDLA認定資格' },
  { name: 'JASA組込技術者', group: 'D', series: 'JASA' },
  { name: 'データサイエンティスト検定', group: 'D', series: '統計検定' },
];

// ─── Microsoft特別措置（カテゴリ別） ─────────────────────────
// retiredAt: その日まで対象 / null=継続
// category: 同一カテゴリ内では重複支給なし
const CERTS_MS = [
  // Modern Work
  { name: 'Administrator Expert', code: '', group: '1', series: 'マイクロソフト', category: 'Modern Work' },
  { name: 'Azure Virtual Desktop Specialty', code: 'AZ-140', group: '2', series: 'マイクロソフト', category: 'Modern Work' },
  // Infrastructure
  { name: 'DevOps Engineer Expert', code: 'AZ-400', group: '1', series: 'マイクロソフト', category: 'Infrastructure' },
  { name: 'Azure for SAP Workloads Specialty', code: 'AZ-120', group: '2', series: 'マイクロソフト', category: 'Infrastructure' },
  // Business Applications
  { name: 'Dynamics 365 Supply Chain Management Functional Consultant Expert', code: 'MB-330', group: '1', series: 'マイクロソフト', category: 'Business Applications' },
  { name: 'Dynamics 365: Finance and Operations Apps Solution Architect Expert', code: 'MB-700', group: '1', series: 'マイクロソフト', category: 'Business Applications' },
  { name: 'Power Platform Solution Architect Expert (2群)', code: 'PL-600', group: '2', series: 'マイクロソフト', category: 'Business Applications' },
  { name: 'Dynamics 365 Business Central Developer Associate', code: 'MB-820', group: '3', series: 'マイクロソフト', category: 'Business Applications' },
  { name: 'Power Platform Solution Architect Expert (3群)', code: 'PL-600', group: '3', series: 'マイクロソフト', category: 'Business Applications' },
  { name: 'Dynamics 365 Customer Insights (Data) Specialty', code: 'MB-260', group: '3', series: 'マイクロソフト', category: 'Business Applications' },
  // Data & AI
  { name: 'Azure Database Administrator Associate', code: 'DP-300', group: '2', series: 'マイクロソフト', category: 'Data & AI' },
  { name: 'Azure Data Scientist Associate', code: 'DP-100', group: '3', series: 'マイクロソフト', category: 'Data & AI', retiredAt: '2026-03-31' },
  { name: 'Azure Data Engineer Associate', code: 'DP-203', group: '3', series: 'マイクロソフト', category: 'Data & AI' },
  { name: 'Power BI Data Analyst Associate', code: 'PL-300', group: '3', series: 'マイクロソフト', category: 'Data & AI', retiredAt: '2025-11-30' },
  { name: 'Azure Cosmos DB Developer Specialty', code: 'DP-420', group: '3', series: 'マイクロソフト', category: 'Data & AI' },
  { name: 'Fabric Analytics Engineer Associate', code: 'DP-600', group: '3', series: 'マイクロソフト', category: 'Data & AI' },
  { name: 'Fabric Data Engineer Associate', code: 'DP-700', group: '3', series: 'マイクロソフト', category: 'Data & AI' },
  // Digital & App Innovation
  { name: 'Azure AI Engineer Associate', code: 'AI-102', group: '2', series: 'マイクロソフト', category: 'Digital & App Innovation' },
  // Security
  { name: 'Cybersecurity Architect Expert', code: 'SC-100', group: '1', series: 'マイクロソフト', category: 'Security' },
  { name: 'Identity and Access Administrator Associate', code: 'SC-300', group: '3', series: 'マイクロソフト', category: 'Security' },
  { name: 'Information Protection and Compliance Administrator Associate', code: 'SC-400', group: '3', series: 'マイクロソフト', category: 'Security' },
];

// MS特別措置の改定タイミング（毎年7月）
const MS_REVIEW_DATE = '2026-07-01'; // 次回改定予定

// ─── ServiceNow特別措置 ─────────────────────────────────────
// 2025年4月1日 〜 2027年3月31日
const CERTS_SNOW = [
  { name: 'Certified Implementation Specialist', group: 'snow-cis', series: 'ServiceNow',
    onetime: 100000, label: '一時金 10万円', condition: '期間中の合格' },
  { name: 'Certified Application Developer (先着3件)', group: 'snow-cad-top', series: 'ServiceNow',
    onetime: 50000, label: '一時金 5万円', condition: '先着3件まで' },
  { name: 'Certified Application Developer (4件目以降)', group: 'snow-cad', series: 'ServiceNow',
    onetime: 30000, label: '一時金 3万円', condition: '先着4件目以降' },
  { name: 'Certified System Administrator (先着3件)', group: 'snow-csa-top', series: 'ServiceNow',
    onetime: 50000, label: '一時金 5万円', condition: '先着3件まで' },
  { name: 'Certified System Administrator (4件目以降)', group: 'snow-csa', series: 'ServiceNow',
    onetime: 30000, label: '一時金 3万円', condition: '先着4件目以降' },
];
const SNOW_PERIOD_END = '2027-03-31';

// ─── 統合データベース（program付与） ─────────────────────────
const CERT_DB = [
  ...CERTS_SPECIAL.map(c => ({ ...c, program: 'special' })),
  ...CERTS_SELF.map(c => ({ ...c, program: 'self' })),
  ...CERTS_MS.map(c => ({ ...c, program: 'ms' })),
  ...CERTS_SNOW.map(c => ({ ...c, program: 'snow' })),
];

// 各エントリにキー（id）を付与（検索・参照用）
CERT_DB.forEach((c, i) => { c.dbId = `${c.program}_${i}`; });

// ─── ヘルパー関数 ───────────────────────────────────────────

// 制度ラベル
function programLabel(program) {
  return ({
    special: '専門技能手当',
    self:    '自己啓発支援金',
    ms:      'MS特別措置',
    snow:    'ServiceNow特別措置',
  })[program] || program;
}

// 区分ラベル（◯群／◯群）
function groupLabel(program, group) {
  if (program === 'special' || program === 'ms') return `${group}群`;
  if (program === 'self') return `${group}群`;
  if (program === 'snow') return '特別';
  return group;
}

// 月額・一時金情報
function getPayment(entry) {
  if (entry.program === 'snow') {
    return { monthly: 0, onetime: entry.onetime || 0, label: entry.label || '' };
  }
  const p = PAYMENT_MASTER[entry.program]?.[entry.group];
  if (!p) return { monthly: 0, onetime: 0, label: '' };
  return {
    monthly: p.monthly || 0,
    onetime: p.onetime || 0,
    label: p.label || '',
  };
}

// 期待リターン情報
function calcReturn(entry) {
  const p = getPayment(entry);
  // 受験料：全エントリで会社支給扱い（PDF上、◯マークは支給対象）
  const examFee = '会社支給';
  if (p.onetime > 0) {
    return {
      type: 'onetime',
      onetime: p.onetime,
      monthly: 0,
      yearly: 0,
      fiveYear: p.onetime,
      examFee,
    };
  }
  if (p.monthly > 0) {
    const yearly = p.monthly * 12;
    const fiveYear = yearly * 5;
    // MS特別措置の対象期間中は5年期限が撤廃される
    const noLimit = entry.program === 'ms';
    return {
      type: 'monthly',
      monthly: p.monthly,
      yearly,
      fiveYear,
      noLimit,
      examFee,
    };
  }
  return { type: 'none', monthly: 0, onetime: 0, yearly: 0, fiveYear: 0, examFee };
}

// アラート判定（廃止予定・特別措置改定など）
function checkAlerts(entry, today = new Date()) {
  const alerts = [];
  // 廃止予定資格
  if (entry.retiredAt) {
    const retired = new Date(entry.retiredAt);
    const diff = Math.ceil((retired - today) / 86400000);
    if (diff > 0 && diff <= 365) {
      alerts.push({ kind: 'retire', urgency: diff <= 90 ? 'high' : 'mid',
        message: `${entry.retiredAt}に廃止予定（あと${diff}日）` });
    } else if (diff <= 0) {
      alerts.push({ kind: 'retired', urgency: 'expired',
        message: '既に廃止済み' });
    }
  }
  // MS特別措置：改定タイミング警告
  if (entry.program === 'ms') {
    const review = new Date(MS_REVIEW_DATE);
    const diff = Math.ceil((review - today) / 86400000);
    if (diff > 0 && diff <= 180) {
      alerts.push({ kind: 'review', urgency: diff <= 90 ? 'mid' : 'low',
        message: `特別措置改定まで${diff}日（5年期限撤廃の対象外になる可能性）` });
    }
  }
  // ServiceNow特別措置：終了タイミング
  if (entry.program === 'snow') {
    const end = new Date(SNOW_PERIOD_END);
    const diff = Math.ceil((end - today) / 86400000);
    if (diff > 0 && diff <= 365) {
      alerts.push({ kind: 'snow-end', urgency: diff <= 90 ? 'high' : 'mid',
        message: `特別措置は${SNOW_PERIOD_END}まで（あと${diff}日）` });
    }
  }
  return alerts;
}

// 検索用の正規化：全角→半角・大文字→小文字にそろえ、ハイフン・空白・中黒を無視する
// （「AZ 400」「az-400」「ＡＺ４００」のどれでも「AZ-400」に一致させるため）
function normalizeSearchText(s) {
  return String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\-‐‑–—−_・]/g, '');
}

// 名前で検索（空白で区切った語がすべて含まれるものに一致）
function searchCertDb(query, filters = {}) {
  const tokens = String(query || '').normalize('NFKC').toLowerCase()
    .split(/\s+/).map(normalizeSearchText).filter(Boolean);
  return CERT_DB.filter(c => {
    if (filters.program && c.program !== filters.program) return false;
    if (filters.group   && c.group   !== filters.group)   return false;
    if (filters.series  && c.series  !== filters.series)  return false;
    if (!tokens.length) return true;
    const text = normalizeSearchText(`${c.name} ${c.code || ''} ${c.series}`);
    return tokens.every(t => text.includes(t));
  });
}

// === ここまで資格データベース ===========================
