# o2o-frontend —— 外卖订餐系统用户端

外卖订餐系统的**用户端前端项目**（纯前端，独立仓库/独立目录）。基于 Vue 3 + Vite 构建，使用 Element Plus 组件库，通过 axios 真实跨域直连后端 REST API（不使用 Vite proxy）。

功能覆盖：菜品浏览与详情、分类筛选、购物车、收货地址管理、下单结算、订单列表与订单详情、用户登录注册与个人中心、首页公告展示。

## 技术栈

| 分类 | 依赖 | 版本 |
| --- | --- | --- |
| 框架 | vue | ^3.5.40 |
| 路由 | vue-router | ^5.2.0 |
| 状态管理 | pinia | ^4.0.2 |
| UI 组件库 | element-plus | ^2.14.3 |
| 图标 | @element-plus/icons-vue | ^2.3.2 |
| HTTP 客户端 | axios | ^1.19.0 |
| 构建工具 | vite | ^8.2.0 |
| Vue 插件 | @vitejs/plugin-vue | ^6.0.8 |
| 按需自动引入 | unplugin-auto-import | ^21.0.0 |
| 组件自动注册 | unplugin-vue-components | ^32.1.0 |

构建配置要点（`vite.config.js`）：

- Element Plus 通过 `unplugin-auto-import` + `unplugin-vue-components`（`ElementPlusResolver`）按需自动引入，无需手动全量注册。
- 路径别名：`@` → `/src`。
- 开发服务器端口固定 `5173`，**不配置 proxy**，前端以真实跨域方式直连后端（后端必须开启 CORS）。

## 目录结构

```
o2o-frontend/
├── public/              # 静态资源（favicon、icons.svg）
├── src/
│   ├── api/             # 接口封装（index.js 为 axios 实例，其余按业务模块拆分）
│   ├── assets/          # 图片与全局样式（main.css）
│   ├── components/      # 公共组件（NavBar / Footer / DishCard）
│   ├── router/          # 路由配置（含登录守卫）
│   ├── stores/          # Pinia store（user / cart）
│   ├── utils/           # 工具函数（format.js：金额、时间、imgUrl、状态枚举）
│   ├── views/           # 页面组件
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
├── .env.development     # 开发环境变量
├── .env.production      # 生产环境变量（部署前必须修改）
└── package.json
```

## 环境要求

- **Node.js 18+**（Vite 8 要求较新的 Node 版本，建议 20+）
- npm（随 Node 一起安装）

> 本机说明：Node 安装在 `D:\nodejs`，**未加入系统 PATH**，因此直接执行 `npm` 会报“无法识别命令”。请参考下方“本机专用”命令。

## 安装与启动

### 一般机器（Node 已在 PATH 中）

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器，http://localhost:5173
npm run build     # 生产构建，产物输出到 dist/
npm run preview   # 本地预览生产构建产物
```

### 本机专用（Node 不在 PATH，PowerShell 5.1）

方式一：临时把 Node 加入当前会话 PATH（推荐，之后即可直接用 `npm`）

```powershell
$env:Path = "D:\nodejs;$env:Path"
npm install
npm run dev
```

方式二：直接用绝对路径调用 npm

```powershell
& 'D:\nodejs\npm.cmd' install
& 'D:\nodejs\npm.cmd' run dev
& 'D:\nodejs\npm.cmd' run build
```

> PowerShell 5.1 中多条命令请用 `;` 分隔，**不支持** `&&`。

启动成功后访问 <http://localhost:5173>，请确保后端已在 `http://localhost:8080` 运行，否则接口请求会失败。

## 环境变量

仅有一个环境变量 `VITE_API_BASE`，表示**后端 API 的根地址**（不含 `/api` 前缀，axios 实例内部会自动拼接 `/api`）。

| 文件 | 生效场景 | 当前值 |
| --- | --- | --- |
| `.env.development` | `npm run dev` | `http://localhost:8080` |
| `.env.production` | `npm run build` | `http://localhost:8080` ⚠️ 需修改 |

> ⚠️ **生产构建前必须修改 `.env.production`**，将 `VITE_API_BASE` 改为真实的后端部署地址（如 `https://api.example.com`）。Vite 环境变量在**构建时**被静态替换写入产物，构建完成后无法再通过运行时配置更改。

## 静态资源说明

**本项目不持有菜品图片等业务图片资源**，它们全部由后端提供：

- 菜品默认图标：`/images/dish/*`（后端 `static` 目录）
- 用户上传图片：`/upload/*`（后端上传目录）

后端接口返回的是相对路径（如 `/images/dish/xxx.svg`），前端统一通过 `src/utils/format.js` 中的 `imgUrl()` 拼接后端地址后再渲染：

```js
export function imgUrl(url) {
  if (!url) return PLACEHOLDER_IMG          // 空值回退占位图
  if (url.startsWith('http')) return url    // 已是绝对地址则原样使用
  return import.meta.env.VITE_API_BASE + url
}
```

因此**修改 `VITE_API_BASE` 会同时切换接口地址与图片地址**，二者无需分别配置。

## 前后端交互约定

- **请求基址**：`VITE_API_BASE + '/api'`，超时 10 秒。
- **会话认证**：axios 配置 `withCredentials: true`，浏览器自动携带后端下发的 `JSESSIONID` Cookie 维持登录态。
- **CORS 要求**：由于前端（5173）与后端（8080）不同源且需携带 Cookie，后端 CORS 必须**显式放行本前端 origin**（`http://localhost:5173`）并设置 `Access-Control-Allow-Credentials: true`；不可使用通配符 `*`，否则携带凭证的请求会被浏览器拦截。
- **统一响应格式**：后端返回 `{code, msg, data}`
  - `code === 1`：成功，响应拦截器直接返回 `data`，业务层无需层层解包；
  - `code === 0`：业务失败，自动 `ElMessage.error(msg)` 提示并 reject；
  - `code === 401`：未登录，自动跳转 `/login` 并带上 `redirect` 参数；登录态探测请求可通过 `silent401` 配置项静默处理，不跳转不提示。

## 关联项目

| 项目 | 路径 | 说明 |
| --- | --- | --- |
| 后端服务 | `../o2o-backend` | Spring Boot 后端，提供 `/api` 接口与静态图片资源 |
| 项目文档 | `../o2o-docs` | 需求分析、概要/详细设计、数据库设计、测试与部署文档 |

本前端需配合后端一起运行：先启动后端（默认 8080 端口），再启动前端开发服务器（5173 端口）。
