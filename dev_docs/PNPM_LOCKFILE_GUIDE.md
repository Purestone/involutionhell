# pnpm 版本管理与 lockfile 一致性指南

## 问题背景

在多人协作的开源项目中，`pnpm-lock.yaml` 文件频繁出现格式变化（如单引号与双引号切换）是一个常见但令人困扰的问题。这会导致：

- PR 中出现大量无意义的 diff
- 增加代码审查的复杂度
- 可能引发 CI 检查失败
- 浪费开发者时间去处理格式差异

## 根本原因

不同版本的 pnpm 使用不同的 YAML 序列化库或配置，即使依赖关系完全相同，生成的 `pnpm-lock.yaml` 格式也可能不同。主要体现在：

1. **引号风格**：某些版本使用单引号，某些版本使用双引号
2. **空格和缩进**：格式化规则可能有细微差异
3. **字段顺序**：对象属性的排序可能不同

## 我们的解决方案

### 1. 锁定 pnpm 版本

项目在 `package.json` 中明确指定了 pnpm 版本：

```json
{
  "packageManager": "pnpm@10.20.0"
}
```

这是 Node.js 官方支持的 `packageManager` 字段，与 corepack 配合使用可以实现自动版本管理。

### 2. 使用 Corepack

Corepack 是 Node.js 16.9+ 自带的工具，能够：

- 自动识别并使用 `package.json` 中指定的包管理器版本
- 无需手动安装或切换版本
- 确保团队成员使用一致的工具链

**启用方式**：

```bash
# 一次性设置
corepack enable

# 之后在项目目录下运行 pnpm 命令，会自动使用 10.20.0
pnpm install
```

### 3. CI 工作流验证

我们在所有 CI 工作流中添加了以下检查：

1. **版本验证**：运行 `check-pnpm-version.mjs` 脚本确保 pnpm 版本正确
2. **Lockfile 一致性检查**：在 `pnpm install` 后验证 lockfile 没有被修改
3. **显式启用 corepack**：在 CI 环境中确保使用正确的版本

### 4. 开发者工具

我们提供了便捷的检查脚本：

```bash
# 检查 pnpm 版本是否正确
pnpm check:pnpm-version

# 检查 lockfile 是否有未预期的修改
pnpm check:lockfile
```

### 5. Pre-commit Hook

项目的 pre-commit hook 会在提交前自动运行版本检查，如果发现版本不匹配会给出警告（但不会阻止提交，以免影响正常工作流）。

## 开发者指南

### 首次设置

```bash
# 1. 克隆项目
git clone https://github.com/involutionhell/involutionhell.git
cd involutionhell

# 2. 启用 corepack（如果还没启用）
corepack enable

# 3. 验证 pnpm 版本
pnpm --version
# 应该显示: 10.20.0

# 4. 安装依赖
pnpm install
```

### 日常开发

每次拉取新代码后：

```bash
# 更新依赖
pnpm install

# 如果 lockfile 有变化但 package.json 没变化，可能是版本问题
pnpm check:pnpm-version
```

### 遇到版本不匹配问题

如果你的 pnpm 版本不正确：

```bash
# 方法 1：使用 corepack（推荐）
corepack enable
corepack prepare pnpm@10.20.0 --activate

# 方法 2：全局安装指定版本
npm install -g pnpm@10.20.0

# 重新安装依赖
rm -rf node_modules
pnpm install
```

### 处理意外的 lockfile 变更

如果发现 lockfile 被意外修改（只有格式变化，没有实际依赖变化）：

```bash
# 1. 丢弃 lockfile 的修改
git checkout pnpm-lock.yaml

# 2. 确认使用正确的 pnpm 版本
pnpm check:pnpm-version

# 3. 重新安装
pnpm install

# 4. 验证没有变更
git status
```

## CI 配置说明

### 工作流变更

所有 GitHub Actions 工作流现在包含以下步骤：

```yaml
steps:
  - uses: actions/checkout@v4

  # 显式启用 corepack
  - name: Enable Corepack
    run: corepack enable

  - uses: pnpm/action-setup@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: pnpm

  # 验证版本
  - name: Check pnpm version
    run: node scripts/check-pnpm-version.mjs

  - run: pnpm install --frozen-lockfile

  # 验证 lockfile 没有被修改
  - name: Check lockfile consistency
    run: |
      if ! git diff --exit-code pnpm-lock.yaml; then
        echo "❌ Error: pnpm-lock.yaml was modified after install"
        exit 1
      fi
```

### 为什么需要这些检查

1. **Enable Corepack**：确保 GitHub Actions 环境使用 `packageManager` 字段指定的版本
2. **Check pnpm version**：明确验证并报告版本，便于调试
3. **Check lockfile consistency**：如果 `pnpm install --frozen-lockfile` 后 lockfile 被修改，说明版本不匹配

## 常见问题

### Q: 为什么不直接在 `pnpm/action-setup@v4` 中指定版本？

A: 虽然可以在 action 中指定版本，但使用 `packageManager` 字段 + corepack 的方式更符合标准，且能确保本地开发和 CI 环境使用相同的配置源。

### Q: 我必须使用 corepack 吗？

A: 不是必须的。你也可以全局安装 `pnpm@10.20.0`。但 corepack 的优势是可以让不同项目使用不同的 pnpm 版本而不冲突。

### Q: 如果我暂时无法升级/切换 pnpm 版本怎么办？

A: 如果你确实无法切换版本，请在 PR 中说明情况。维护者可以在合并前重新生成 lockfile。但这会增加维护负担，建议尽量使用统一的版本。

### Q: 这个问题是 pnpm 的 bug 吗？

A: 不是 bug。不同版本的工具使用不同的实现是正常的。这个问题的本质是需要团队协调统一工具版本。

## 技术细节

### pnpm-lock.yaml 格式版本

pnpm-lock.yaml 文件开头的 `lockfileVersion` 字段表示格式版本：

```yaml
lockfileVersion: "9.0"
```

不同的 pnpm 版本可能使用不同的 lockfile 格式版本。pnpm 10.x 使用版本 9.0。

### YAML 序列化差异

不同的 YAML 库对字符串的引号处理规则不同：

- 某些实现总是使用双引号
- 某些实现只在必要时使用引号
- 某些实现偏好单引号

pnpm 依赖的 YAML 库在不同版本之间可能有变化，导致相同数据的不同表示。

## 参考资源

- [Corepack 官方文档](https://nodejs.org/api/corepack.html)
- [pnpm packageManager 字段](https://pnpm.io/package_json#packagemanager)
- [pnpm lockfile 规范](https://pnpm.io/git#lockfiles)

## 反馈和改进

如果你发现此解决方案仍然存在问题，或有改进建议，请：

1. 在项目中创建 Issue
2. 说明具体的场景和复现步骤
3. 附上你的环境信息（pnpm 版本、Node 版本、操作系统等）

我们会持续优化这个流程以减少协作中的摩擦。
