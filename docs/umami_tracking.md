# Umami 埋点设计文档

本文档描述了 Involution Hell 网站 (involutionhell.com) 的用户行为埋点设计。使用 Umami v2 进行数据采集。

## 1. 全局组件 (Global Components)

这些元素出现在几乎所有页面上（如页眉、页脚）。

| 区域       | 按钮/元素说明                     | 触发行为 | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                                                |
| :--------- | :-------------------------------- | :------- | :---------------------- | :------------------------------------------------------------------- |
| **Header** | 导航栏链接 (特点, 社区, 联系我们) | 点击     | `header_nav_click`      | `label`: 具体链接名称 (e.g., "features", "community", "contact")     |
| **Header** | GitHub 图标按钮                   | 点击     | `social_click`          | `platform`: "github", `location`: "header"                           |
| **Header** | Discord 图标按钮                  | 点击     | `social_click`          | `platform`: "discord", `location`: "header"                          |
| **Header** | 主题切换 (Theme Toggle)           | 点击     | `theme_toggle`          | `theme`: 切换后的主题 ("light" / "dark")                             |
| **Header** | 登录按钮 (Sign In)                | 点击     | `auth_click`            | `action`: "signin", `location`: "header"                             |
| **Header** | 用户菜单 (User Menu)              | 点击     | `user_menu_click`       | -                                                                    |
| **Footer** | GitHub 链接                       | 点击     | `social_click`          | `platform`: "github", `location`: "footer"                           |
| **Footer** | Discord 链接                      | 点击     | `social_click`          | `platform`: "discord", `location`: "footer"                          |
| **Footer** | 归档链接 (Archives)               | 点击     | `footer_link_click`     | `category`: "archives", `label`: 链接名称 (e.g., "AI & Mathematics") |
| **Footer** | 资源链接 (Resources)              | 点击     | `footer_link_click`     | `category`: "resources", `label`: 链接名称 (e.g., "Zotero Library")  |

## 2. 首页 (Home Page - /)

| 区域                  | 按钮/元素说明                  | 触发行为 | 埋点事件名 (Event Name)      | 埋点传参 (Event Data)                                        |
| :-------------------- | :----------------------------- | :------- | :--------------------------- | :----------------------------------------------------------- |
| **Hero**              | 核心分类卡片 (AI, CS, etc.)    | 点击     | `home_category_click`        | `category`: 分类名称 (e.g., "AI", "Computer Science")        |
| **Hero**              | 投稿按钮 (Submit Contribution) | 点击     | `contribute_trigger`         | `location`: "hero"                                           |
| **Hero (Contribute)** | 投稿弹窗 - 跳转 GitHub         | 点击     | `contribute_github_redirect` | `dir`: 目录路径, `filename`: 文件名                          |
| **Hero (Right)**      | 访问文章按钮 (Access Articles) | 点击     | `feature_cta_click`          | `action`: "access_articles", `location`: "hero_sidebar"      |
| **Community**         | 知识库 - 访问文章按钮          | 点击     | `feature_cta_click`          | `action`: "access_articles", `location`: "community_section" |
| **Community**         | GitHub 仓库卡片按钮            | 点击     | `social_click`               | `platform`: "github", `location`: "community_card"           |
| **Community**         | Discord 社区卡片按钮           | 点击     | `social_click`               | `platform`: "discord", `location`: "community_card"          |
| **Community**         | Zotero 文献库卡片按钮          | 点击     | `resource_click`             | `type`: "zotero", `location`: "community_card"               |

## 3. 文档页 (Documentation - /docs/\*)

| 区域          | 按钮/元素说明                     | 触发行为 | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                                                          |
| :------------ | :-------------------------------- | :------- | :---------------------- | :----------------------------------------------------------------------------- |
| **Sidebar**   | 侧边栏导航链接                    | 点击     | `docs_nav_click`        | `path`: 目标路径                                                               |
| **Content**   | 在 GitHub 上编辑 (Edit on GitHub) | 点击     | `docs_edit_click`       | `page`: 当前页面路径                                                           |
| **Assistant** | AI 助手 - 打开聊天                | 点击     | `ai_assistant_open`     | -                                                                              |
| **Assistant** | AI 助手 - 发送消息                | 发送     | `ai_assistant_query`    | `length`: 字符数范围 (e.g., "0-50", "50-100") _注意：不记录具体内容以保护隐私_ |
| **Content**   | 复制生词/代码块                   | 点击     | `content_copy`          | `type`: "code" 或 "text"                                                       |

## 4. 登录页 (Login - /login)

| 区域     | 按钮/元素说明 | 触发行为 | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                        |
| :------- | :------------ | :------- | :---------------------- | :------------------------------------------- |
| **Main** | 登录按钮      | 点击     | `auth_click`            | `action`: "signin", `location`: "login_page" |

## 实施指南

在 Next.js / React 中使用 Umami 进行埋点可以通过添加 `data-umami-event` 属性来实现，或者使用 `window.umami.track()` 函数。

### 示例 1: HTML 属性方式 (推荐用于静态内容)

```jsx
<button
  data-umami-event="auth_click"
  data-umami-event-action="signin"
  data-umami-event-location="header"
>
  Sign In
</button>
```

### 示例 2: JS 函数方式 (推荐用于动态交互)

```javascript
// 在组件中调用
const handleThemeToggle = (newTheme) => {
  setTheme(newTheme);
  if (window.umami) {
    window.umami.track("theme_toggle", { theme: newTheme });
  }
};
```
