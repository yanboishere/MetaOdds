# Implementation Plan

- [x] 1. 初始化项目结构
  - 创建 `package.json` 配置 Vite + TypeScript + React
  - 创建 `manifest.json` (Manifest V3)
  - 创建 `tsconfig.json` 配置
  - 创建 `vite.config.ts` 配置浏览器扩展构建
  - 创建目录结构 (src/content, src/background, src/api, src/matcher, src/popup, src/utils)
  - 安装依赖 (vite, typescript, react, @crxjs/vite-plugin, vitest, fast-check)
  - _Requirements: 1.1, 1.2_

- [x] 2. 实现核心工具函数
  - [x] 2.1 实现价格计算工具 (`src/utils/price.ts`)
    - 实现 `priceToPercentage()` - 价格转百分比
    - 实现 `calculatePriceDifference()` - 计算价格差异
    - 实现 `findBestPrices()` - 找出最佳价格
    - _Requirements: 2.3, 3.3, 5.3, 5.4_

  - [ ]* 2.2 为价格计算编写属性测试
    - **Property 6: Probability percentage conversion**
    - **Property 18: Price difference calculation**
    - **Property 17: Best price highlighting**
    - **Validates: Requirements 2.3, 3.3, 5.3, 5.4**

  - [x] 2.3 实现存储工具 (`src/utils/storage.ts`)
    - 实现 `saveSettings()` - 保存设置到 chrome.storage.local
    - 实现 `loadSettings()` - 加载设置
    - 实现默认设置
    - _Requirements: 6.2, 6.3_

  - [ ]* 2.4 为设置持久化编写属性测试
    - **Property 19: Settings persistence round-trip**
    - **Validates: Requirements 6.2, 6.3**

- [x] 3. 实现事件匹配器
  - [x] 3.1 实现模糊匹配算法 (`src/matcher/fuzzy.ts`)
    - 实现 `tokenize()` - 文本分词
    - 实现 `calculateWordOverlap()` - 计算词重叠度
    - 实现 `fuzzyMatch()` - 模糊字符串匹配
    - _Requirements: 4.1_

  - [ ]* 3.2 为模糊匹配编写属性测试
    - **Property 10: Fuzzy matching relevance**
    - **Validates: Requirements 4.1**

  - [x] 3.3 实现事件匹配器 (`src/matcher/matcher.ts`)
    - 实现 `calculateRelevance()` - 计算相关性分数
    - 实现 `findMatches()` - 查找匹配事件
    - 实现 `sortByRelevance()` - 按相关性排序
    - 实现类别和日期匹配加成
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 3.4 为事件匹配器编写属性测试
    - **Property 11: Result ranking by relevance**
    - **Property 12: Result count limit**
    - **Property 14: Category and date matching boost**
    - **Validates: Requirements 4.2, 4.3, 4.5**

- [x] 4. 实现平台 API 适配器
  - [x] 4.1 定义 API 类型 (`src/api/types.ts`)
    - 定义 `UnifiedMarket` 接口
    - 定义 `MarketOdds` 接口
    - 定义 `PlatformAdapter` 接口
    - _Requirements: 2.2, 3.2_

  - [x] 4.2 实现 Polymarket 适配器 (`src/api/polymarket.ts`)
    - 实现 `searchMarkets()` - 搜索市场
    - 实现 `normalizeMarket()` - 标准化市场数据
    - 实现错误处理和超时逻辑
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ]* 4.3 为 Polymarket 适配器编写属性测试
    - **Property 4: Polymarket data extraction completeness**
    - **Property 7: API failure error message**
    - **Property 8: Search query formatting**
    - **Validates: Requirements 2.2, 2.4, 2.5**

  - [x] 4.4 实现 Opinion 适配器 (`src/api/opinion.ts`)
    - 实现 `searchMarkets()` - 搜索市场
    - 实现 `normalizeMarket()` - 标准化市场数据
    - 实现错误处理和超时逻辑
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 4.5 为 Opinion 适配器编写属性测试
    - **Property 5: Opinion data extraction completeness**
    - **Property 7: API failure error message**
    - **Property 9: Request timeout handling**
    - **Validates: Requirements 3.2, 3.4, 7.2**

- [x] 5. Checkpoint - 确保核心逻辑测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 6. 实现 Background Script
  - [x] 6.1 实现消息处理器 (`src/background/message-handler.ts`)
    - 定义消息类型 (QUERY_ODDS, GET_SETTINGS, UPDATE_SETTINGS)
    - 实现消息路由逻辑
    - _Requirements: 1.4_

  - [x] 6.2 实现查询服务 (`src/background/query-service.ts`)
    - 实现 `queryAllPlatforms()` - 并行查询所有平台
    - 实现平台过滤（根据设置排除禁用平台）
    - 实现结果聚合和最佳价格计算
    - _Requirements: 2.1, 3.1, 6.4_

  - [ ]* 6.3 为平台排除编写属性测试
    - **Property 20: Platform exclusion**
    - **Validates: Requirements 6.4**

  - [x] 6.4 实现 Background Script 入口 (`src/background/background.ts`)
    - 注册消息监听器
    - 初始化设置
    - _Requirements: 6.3_

- [x] 7. 实现 Content Script
  - [x] 7.1 实现选择检测器 (`src/content/selection.ts`)
    - 实现 `onMouseUp` 事件监听
    - 实现选择文本提取
    - 实现域名检测（仅在 Polymarket/Opinion 激活）
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 7.2 为选择检测编写属性测试
    - **Property 1: Selection detection on target domains**
    - **Property 3: Selection text extraction**
    - **Validates: Requirements 1.1, 1.2, 1.5**

  - [x] 7.3 实现触发按钮 (`src/content/trigger.ts`)
    - 实现按钮创建和定位
    - 实现按钮点击事件
    - 实现按钮隐藏逻辑
    - _Requirements: 1.3, 1.4_

  - [ ]* 7.4 为触发按钮定位编写属性测试
    - **Property 2: Trigger button positioning**
    - **Validates: Requirements 1.3**

  - [x] 7.5 实现弹窗面板 (`src/content/popup.ts`)
    - 实现弹窗创建和定位
    - 实现加载状态显示
    - 实现结果渲染（平台名、标题、价格）
    - 实现最佳价格高亮
    - 实现价格差异显示
    - 实现点击跳转功能
    - 实现点击外部关闭
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1_

  - [ ]* 7.6 为弹窗显示编写属性测试
    - **Property 15: Popup positioning**
    - **Property 16: Odds display completeness**
    - **Property 21: Loading indicator display**
    - **Validates: Requirements 5.1, 5.2, 7.1**

  - [x] 7.7 实现 Content Script 入口 (`src/content/content.ts`)
    - 初始化选择检测器
    - 注入样式
    - _Requirements: 1.1, 1.2_

- [x] 8. 实现错误处理
  - [x] 8.1 实现错误处理工具 (`src/utils/error.ts`)
    - 定义错误类型
    - 实现 `handleApiError()` - API 错误处理
    - 实现 `fetchWithRetry()` - 带重试的请求
    - _Requirements: 2.4, 3.4, 7.2, 7.3, 7.4_

  - [x] 8.2 更新弹窗面板错误显示
    - 实现错误消息显示
    - 实现重试按钮
    - 实现网络错误提示
    - _Requirements: 7.3, 7.4_

  - [ ]* 8.3 为错误处理编写属性测试
    - **Property 22: All-fail error with retry**
    - **Property 23: Network error suggestion**
    - **Validates: Requirements 7.3, 7.4**

  - [x] 8.4 更新弹窗面板空结果显示
    - 实现无匹配消息显示
    - _Requirements: 4.4_

  - [ ]* 8.5 为空结果处理编写属性测试
    - **Property 13: Empty result handling**
    - **Validates: Requirements 4.4**

- [x] 9. 实现设置页面
  - [x] 9.1 创建设置页面 HTML (`src/popup/popup.html`)
    - 创建基础 HTML 结构
    - 引入 React 入口
    - _Requirements: 6.1_

  - [x] 9.2 实现设置页面组件 (`src/popup/popup.tsx`)
    - 实现平台开关组件
    - 实现设置加载和保存
    - _Requirements: 6.1, 6.2_

  - [x] 9.3 添加设置页面样式 (`src/popup/popup.css`)
    - 添加基础样式
    - _Requirements: 6.1_

- [x] 10. 添加 Content Script 样式
  - 创建 `src/styles/content.css`
  - 添加触发按钮样式
  - 添加弹窗面板样式
  - 添加加载动画样式
  - 添加最佳价格高亮样式
  - _Requirements: 5.1, 5.2, 5.3, 7.1_

- [x] 11. 创建扩展图标
  - 创建 `public/icons/icon16.png`
  - 创建 `public/icons/icon48.png`
  - 创建 `public/icons/icon128.png`

- [x] 12. 配置构建和开发脚本
  - 更新 `package.json` scripts
  - 配置 Vite 热重载
  - 配置生产构建
  - _Requirements: 1.1, 1.2_

- [x] 13. Final Checkpoint - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户
