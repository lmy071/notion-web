# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## CI/CD 配置

本项目已配置 GitHub Actions 自动构建与部署。当代码合并到 `master` 分支时，将自动触发构建并将 `dist` 目录下的内容部署到目标服务器。

### 敏感信息配置

为了使部署工作流正常运行，您需要在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下加密变量（Repository secrets）：

| 变量名 | 说明 |
| :--- | :--- |
| `SERVER_HOST` | 目标服务器的 IP 地址或域名 |
| `SERVER_USER` | 用于 SSH 连接的用户名 |
| `SERVER_SSH_KEY` | 用于 SSH 连接的私钥（建议使用密钥而非密码） |
| `SERVER_PORT` | SSH 端口号（默认为 22，可选） |

### 部署路径

工作流默认将编译后的文件发送到服务器的 `/www/server` 目录下。如果需要更改，请修改 `.github/workflows/deploy.yml` 中的 `target` 字段。

