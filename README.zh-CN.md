# Solana Token Lab

[English](README.md) · 简体中文

用 Next.js、React 和 TypeScript 写的 Solana 代币应用。从创建 Mint、管理余额和权限、设置元数据，到流动性池和兑换，都可以在页面里操作。每个功能都写了相关账户的说明，以及操作后该去链上核对什么。

项目直接调用 Solana 现有程序，仓库里没有自定义 Rust 或 Anchor 合约。交易由连接的钱包签名并支付费用。

作者 **[0xF1](https://fone.cc)**。其他项目和文章放在 **[fone.cc](https://fone.cc)**。如果这个项目帮到了你，欢迎在 [GitHub 点个 Star](https://github.com/fonecc/solana-token-manager)。

## 功能

| 模块 | 实现 | 说明 |
| --- | --- | --- |
| 钱包 | Phantom 适配器和 Wallet Standard 钱包发现 | 可用钱包取决于浏览器和已安装的扩展。 |
| 创建代币 | 一笔交易创建 Mint 和自己的 ATA | 经典 SPL Token；界面支持 0–9 位小数，初始供应量为 0。 |
| 资产列表 | 合并同一 Mint 下多个账户的余额，读取元数据和权限 | 通过当前钱包的 Token Account 发现 Mint，不是全链权限索引。 |
| 增发 | 检查 Mint Authority，按需创建接收者 ATA | 输入的是新增数量，不是目标总供应量。 |
| 转账 | SPL Token 和 SOL 转账 | SPL 转账使用发送者 ATA；列表合计可能包含其他账户的余额。 |
| 销毁 | 按真实精度构造 Checked 指令 | 减少供应量，不会关闭账户或退还租金。 |
| 冻结 / 解冻 | 检查 Freeze Authority，操作目标钱包的 ATA | 冻结的是代币账户，不是钱包；不接受任意非 ATA 账户输入。 |
| 撤销权限 | 永久撤销铸币或冻结权限 | 不可逆。撤销冻结权限前，先解冻受影响的账户。 |
| 元数据 | 创建 / 更新 Metaplex 元数据，支持 IPFS URI 和锁定元数据 | JSON 和图片需要自行准备公开地址，不提供文件上传服务。 |
| DeFi | OpenBook 市场、Raydium AMM V4 建池、加流动性和兑换 | 建池使用 Mint / WSOL 交易对，不支持 CLMM、CPMM 或自动路由。 |

当前使用 **Devnet**。尚未实现 Token-2022、移除流动性、自定义合约和主网写操作。

## 本地运行

使用 Node.js 24 和 npm。`.nvmrc` 固定 Node 主版本，补丁版本建议跟进安全更新。不要求安装 Solana CLI。

```bash
nvm use
npm ci
npm run dev
```

打开 [localhost:3000](http://localhost:3000)。需要换端口时：

```bash
npm run dev -- --port 3100
```

阅读手册不需要连接钱包。要发送交易，准备一个独立钱包和少量 Devnet SOL，用来支付手续费及账户租金。

### RPC 配置

默认使用 Solana 公共 Devnet RPC。需要换成自己的 Devnet 节点时，在 `.env.local` 中设置，配置示例见 [`.env.example`](.env.example)：

```dotenv
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

`NEXT_PUBLIC_` 变量会打进浏览器代码，不能当作保密配置。不要放私钥或服务端密钥；浏览器端使用的 RPC 凭据应配置提供商支持的域名和额度限制。

应用会在交易签名前、请求空投前检查 RPC 的 genesis hash。只修改这个地址不会开启主网支持。

**从旧版本升级：** 现在不再使用 `NEXT_PUBLIC_MINT_AUTHORITY_PRIVATE_KEY`，请从本地配置中移除。如果这个私钥曾进入公开构建产物，应停用该账户，并检查它的资产和权限。

## 怎么使用

第一次可以按这个顺序走：

1. 连接钱包，检查网络标识。
2. 在“创建代币”页面获取 Devnet SOL。空投可能被限流，确认后再检查余额。
3. 创建一个 6 位精度的 Mint，保存 Mint 地址、ATA 和交易签名。
4. 设置元数据，分别给自己和第二个钱包增发少量代币。
5. 试一次转账、冻结 / 解冻和销毁，每次都核对账户余额和总供应量。
6. 把撤销权限留到最后，使用可以丢弃的 Mint。
7. 理解代币账户之后，再看市场、池和兑换。

桌面端使用左侧课程菜单，手机端通过课程抽屉切换。已访问的课程会保留挂载，切课或打开手册不会清掉当前草稿和交易反馈。切换钱包会重置工作区；刷新页面可能丢失草稿和内存记录，地址与签名请另行保存。

### 语言和手册

网页支持英文、简体中文和繁体中文，默认英文。语言由 URL 决定，不按浏览器语言自动跳转。

| 语言 | 应用 | 手册 |
| --- | --- | --- |
| English | `/` | `/?manual=contents` |
| 简体中文 | `/zh-CN` | `/zh-CN?manual=contents` |
| 繁體中文 | `/zh-TW` | `/zh-TW?manual=contents` |

页头、课程菜单底部和每课的指南按钮都能打开手册。手册显示在当前工作区，主菜单不变。三语各有 12 章，包含准备条件、操作步骤、签名前核对、链上验证、故障处理、术语和参考来源。

章节链接使用 `/?manual=create` 这类 query。切语言会保留章节和页内锚点；旧的 `/manual`、`/manual/:topic` 链接会跳转到工作区里的手册视图。

用户输入的名称、符号、URI、地址和精确数量不翻译。RPC / SDK 的原始诊断保留原文，钱包扩展的语言由扩展自身控制。

## 开发说明

- **金额：** 表单使用十进制字符串，链上整数使用 `bigint` 或 SDK 的 `BN`。构造指令前不要先转成 `Number`。
- **交易：** 共用执行器处理当前 Legacy 交易流程、SDK 额外签名者、确认和分步签名记录。提交成功不等于链上确认。
- **待确认状态：** 重试前先查原签名。执行器不会换一个 blockhash 自动重做结果不明的操作。同标签页的 pending 保护不是跨标签锁，也不是链上幂等保证。
- **多步骤操作：** 后一步失败不会撤销前面已确认的交易。恢复时要用到市场地址和各步签名。
- **界面与服务：** 组件负责表单和反馈；指令构造、账户校验及协议检查放在 `src/lib/solana`。

```text
src/
├── pages/                 # Pages Router 页面入口
├── components/
│   ├── learning/          # 工作区、课程和共享上下文
│   ├── manual/            # 工作区内手册
│   ├── brand/             # 品牌、作者链接和页尾
│   └── common/            # 地址与交易反馈
├── content/manual/        # 三语手册内容
├── i18n/                  # 类型化消息与语言切换
├── hooks/                 # 资产读取及异步生命周期
├── theme/                 # Chakra 主题
└── lib/solana/             # 金额、账户、指令、交易执行和 DeFi
messages/                  # 界面翻译
```

### 检查与生产构建

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

测试使用模拟钱包和 RPC 响应，不广播交易。CI 执行安装、类型检查、Lint、测试和构建。这些检查通过不代表真实钱包流程已经验收。

## 常见问题

**列表显示余额足够，转账却失败。** 列表合并了同一 Mint 下多个账户的余额。转账和销毁使用 ATA，检查它的余额和冻结状态。

**代币没有图片。** 元数据 URI 和其中的 `image` 地址都需要能被浏览器公开读取。可以参考 [`public/token-metadata.example.json`](public/token-metadata.example.json)，记得替换示例图片地址。

**找不到池。** 创建 Mint 不会自动产生流动性。检查网络、交易对、协议和池状态，应用不会拿无关的池来兜底。

**确认超时。** 用原交易签名查 Explorer 或可信 RPC。不要通过刷新、切钱包或开新标签绕过 pending 保护。

## 反馈与许可证

问题和修复可以提交到 [GitHub](https://github.com/fonecc/solana-token-manager)。报告问题时附上复现步骤、预期结果；涉及交易时，可以附公开签名。不要上传私钥、助记词或 RPC 凭据。

旧协议 SDK 的部分传递依赖仍有未解决的安全告警。本项目没有通过安全审计。

仓库目前没有 `LICENSE` 文件，许可证尚未确定。
