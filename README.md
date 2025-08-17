# PasswordKeeper - 基于Zama FHE的密码管理器

一个使用Zama全同态加密(FHE)技术构建的去中心化密码管理器，可以安全地在区块链上存储和管理密码，同时保持密码的完全机密性。

## 🌟 特性

- 🔐 **完全加密**: 使用Zama FHE技术，密码在链上始终保持加密状态
- 🔒 **隐私保护**: 密码永不以明文形式暴露，包括在智能合约执行期间
- 🏦 **去中心化**: 基于区块链，无需信任第三方服务商
- 🚀 **用户友好**: 直观的Web界面和完整的命令行工具
- 🔧 **开发者友好**: 完整的测试套件和详细的文档
- 💼 **多平台支持**: 可为不同平台（GitHub、Google、Facebook等）存储密码

## 🏗️ 项目结构

```
├── contracts/              # 智能合约
│   ├── PasswordKeeper.sol  # 主密码管理合约
│   └── FHECounter.sol      # 示例计数器合约
├── deploy/                 # 部署脚本
│   └── passwordkeeper.ts   # PasswordKeeper部署脚本
├── tasks/                  # Hardhat任务脚本
│   └── PasswordKeeper.ts   # 密码管理任务
├── test/                   # 测试文件
│   └── PasswordKeeper.ts   # 完整测试套件
├── app/                    # 前端Web应用
│   ├── index.html          # 主页面
│   ├── app.js             # 应用逻辑
│   └── README.md          # 前端使用说明
└── docs/                   # 技术文档
    ├── zama_llm.md        # Zama FHE开发指南
    └── zama_doc_relayer.md # Relayer SDK文档
```

## 🚀 快速开始

### 环境要求

- Node.js (版本 20+)
- npm (版本 7+)
- MetaMask浏览器扩展

### 安装依赖

```bash
npm install
```

### 编译合约

```bash
npm run compile
```

### 运行测试

```bash
npm test
```

### 本地部署

```bash
# 启动本地Hardhat网络
npx hardhat node

# 在另一个终端部署合约
npx hardhat deploy --network localhost
```

## 📖 使用指南

### 1. 智能合约功能

PasswordKeeper合约提供以下主要功能：

- **存储密码**: 加密存储平台密码
- **检索密码**: 获取加密密码（仅限所有者）
- **删除密码**: 删除指定平台的密码
- **批量操作**: 一次性存储多个密码
- **平台管理**: 列出所有存储密码的平台

### 2. 命令行工具

#### 存储密码
```bash
npx hardhat pk:store --contract 0x... --platform "github" --password "mypassword123"
```

#### 获取密码列表
```bash
npx hardhat pk:list --contract 0x...
```

#### 查看密码（加密格式）
```bash
npx hardhat pk:get --contract 0x... --platform "github"
```

#### 删除密码
```bash
npx hardhat pk:delete --contract 0x... --platform "github"
```

#### 批量存储
```bash
npx hardhat pk:batch-store --contract 0x... --data '[{"platform":"github","password":"pass1"},{"platform":"google","password":"pass2"}]'
```

### 3. Web界面

启动前端应用：

```bash
cd app
python3 -m http.server 8000
# 或使用 npx serve .
```

访问 `http://localhost:8000` 使用Web界面进行：
- 连接MetaMask钱包
- 存储和管理密码
- 查看密码统计信息
- 测试格式转换功能

## 🔧 技术架构

### 核心技术栈

- **智能合约**: Solidity + Zama FHEVM
- **开发框架**: Hardhat
- **前端**: 原生JavaScript + Bootstrap 5
- **区块链交互**: Ethers.js
- **加密库**: Zama Relayer SDK

### 加密机制

1. **密码转换**: 密码字符串 → 数值哈希 → euint32加密类型
2. **链上存储**: 使用FHE加密，永不解密
3. **访问控制**: 基于Zama ACL系统，确保只有所有者可访问
4. **隐私保护**: 所有操作都在加密状态下进行

## 🧪 测试

项目包含全面的测试套件：

```bash
# 运行所有测试
npm test

# 运行特定测试
npx hardhat test test/PasswordKeeper.ts

# 在Sepolia测试网运行测试
npm run test:sepolia
```

测试涵盖：
- 基本密码存储和检索
- 多平台密码管理
- 批量操作
- 错误处理
- 用户隔离
- 时间戳功能

## 🚀 部署

### Sepolia测试网部署

1. 配置环境变量：
```bash
# 设置助记词
npx hardhat vars set MNEMONIC

# 设置Infura API密钥
npx hardhat vars set INFURA_API_KEY
```

2. 部署合约：
```bash
npx hardhat deploy --network sepolia
```

3. 验证部署：
```bash
npx hardhat pk:info --contract <deployed_address> --network sepolia
```

## 🔐 安全考虑

1. **私钥保护**: 永远不要在代码中暴露私钥
2. **网络确认**: 在主网部署前充分测试
3. **合约验证**: 确保使用正确的合约地址
4. **访问控制**: 合约自动处理ACL权限管理
5. **加密强度**: 使用Zama的生产级FHE加密

## 📋 开发指南

### 添加新功能

1. 在合约中添加新函数
2. 更新ABI定义
3. 添加对应的测试用例
4. 创建Hardhat任务脚本
5. 更新前端界面

### 自定义密码转换

当前使用简单的哈希函数将密码转换为数值，可以根据需要实现更复杂的转换逻辑：

```solidity
// 在合约中可以添加更安全的转换函数
function securePasswordHash(string memory password) public pure returns (uint32) {
    // 实现更复杂的哈希逻辑
}
```

## 🤝 贡献指南

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📚 相关资源

- [Zama FHEVM文档](https://docs.zama.ai/)
- [Hardhat文档](https://hardhat.org/docs)
- [Zama社区论坛](https://community.zama.ai/)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)

## 📄 许可证

本项目基于BSD-3-Clause-Clear许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Zama团队提供的出色FHE技术
- Hardhat团队的开发工具支持
- 开源社区的贡献和反馈

---

**⚠️ 免责声明**: 本项目仅供学习和演示目的。在生产环境中使用前，请进行充分的安全审计和测试。
