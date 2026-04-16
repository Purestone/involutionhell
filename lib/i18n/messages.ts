/**
 * 站内 UI 字符串字典。所有 key 两种语言必须同结构，否则 TS 类型约束会红。
 *
 * 约定：
 * - 纯静态字符串直接写
 * - 带参数用 {name} 占位，调用方通过 formatMessage 填充
 * - key 用扁平结构（profile.stats.docs），避免 type 推导嵌套过深
 */

const zh = {
  // 个人主页
  "profile.dossier": "User Dossier",
  "profile.volumeIssue": "Vol. 1 Issue {id}",
  "profile.fullRank": "总排行榜 →",
  "profile.editProfile": "编辑主页 →",
  "profile.sec.profile": "SEC. PROFILE · 001",
  "profile.stats.docs": "文档贡献",
  "profile.stats.commits": "累计 Commits",
  "profile.stats.points": "积分",
  "profile.empty.title": "还没填个人项目和最近在读的论文",
  "profile.empty.subtitle": "下方仍会显示 GitHub repos 和文档贡献",

  // 关注按钮
  "follow.followers": "粉丝",
  "follow.following": "关注",
  "follow.signInToFollow": "登录后关注",
  "follow.follow": "+ 关注",
  "follow.unfollow": "已关注",

  // 活跃度热力图
  "activity.sec": "SEC. ACTIVITY · 005",
  "activity.heading": "活跃度 · 最近 52 周",
  "activity.stats": "{days} 天有贡献 · 合计 {commits} commits",
  "activity.legend.less": "少",
  "activity.legend.more": "多",
  "activity.weekday.mon": "周一",
  "activity.weekday.thu": "周四",
  "activity.weekday.sat": "周六",
  "activity.month.1": "1月",
  "activity.month.2": "2月",
  "activity.month.3": "3月",
  "activity.month.4": "4月",
  "activity.month.5": "5月",
  "activity.month.6": "6月",
  "activity.month.7": "7月",
  "activity.month.8": "8月",
  "activity.month.9": "9月",
  "activity.month.10": "10月",
  "activity.month.11": "11月",
  "activity.month.12": "12月",

  // GitHub repos
  "repos.sec": "SEC. REPOS · 006",
  "repos.heading": "GitHub 仓库",
  "repos.subtitle": "公开仓库 · 按 stars + 更新时间排序",
  "repos.count": "{n} 个项目",

  // 贡献文档列表
  "docs.sec": "SEC. DOCS · 007",
  "docs.heading": "贡献过的文档",
  "docs.count": "{n} 篇 · 合计 {commits} commits",
  "docs.showMore": "展开剩余 {n} 篇 ↓",

  // ProfileCard
  "card.kind.project": "项目",
  "card.kind.paper": "论文",
  "card.kind.doc": "文档",
  "card.view": "查看 →",

  // 编辑页
  "edit.pageTitle": "编辑个人主页",
  "edit.pageHeader": "Edit · User Dossier",
  "edit.loading": "正在加载...",
  "edit.auth.required": "需要登录后才能编辑个人主页。",
  "edit.auth.signIn": "Sign In →",
  "edit.auth.notYours": "这不是你的主页（URL 标识 {id}），只有本人可以编辑。",
  "edit.auth.goMine": "去我的主页 →",
  "edit.intro.label": "About this page",
  "edit.intro.body":
    "这里填的内容会显示在你的个人主页 /u/{id} 上，让别人知道你是谁、做什么、在读什么。全部字段都是可选，填哪个显示哪个；不填主页就只显示 GitHub 基础信息 + 贡献统计。",
  "edit.cta.save": "保存 →",
  "edit.cta.saving": "保存中...",
  "edit.cta.cancel": "取消",
  "edit.status.saved": "已保存，返回主页...",
  "edit.error.noToken": "未检测到登录 token，请重新登录",
  "edit.error.http": "保存失败：HTTP {status}",
  "edit.error.unknown": "保存出错",
  "edit.section.add": "+ 新增",
  "edit.section.remove": "删除此项",

  // 编辑页 Section 1: Identity
  "edit.sec1.title": "SEC. 01 · IDENTITY",
  "edit.sec1.heading": "关于你自己",
  "edit.sec1.description":
    "一句小标题 + 一段自我介绍，会显示在主页左侧大块最上方。相当于你在站内的名片。",
  "edit.sec1.tagline.label": "一句话标签（tagline，80 字以内）",
  "edit.sec1.tagline.placeholder":
    "比如：LLM Safety 方向 · UNSW 在读 / 全栈搞着玩 / 找暑期实习中",
  "edit.sec1.bio.label": "自我介绍（bio，80-200 字较合适）",
  "edit.sec1.bio.placeholder":
    "你是谁、在做什么、感兴趣的方向。举例：我是 xxx，读研在做 LLM 对齐，平时写写文档和小工具。想认识做 RLHF / 评估 / infra 的朋友。",

  // 编辑页 Section 2: Links
  "edit.sec2.title": "SEC. 02 · LINKS",
  "edit.sec2.heading": "外部链接",
  "edit.sec2.description":
    "想让大家跟你联系 / 了解你的其他地方。最多 5 条，会显示在主页左侧大块底部，以小按钮形式展示。",
  "edit.sec2.label.placeholder": "按钮上显示的字，如 Blog / Twitter / 知乎",
  "edit.sec2.url.placeholder": "https://your-blog.com",

  // 编辑页 Section 3: Projects
  "edit.sec3.title": "SEC. 03 · PROJECTS",
  "edit.sec3.heading": "你自己的项目",
  "edit.sec3.description":
    "想展示的个人项目 / 玩具 / 开源作品。GitHub 公开 repos 会自动出现在主页底部，这里填 GitHub 里没有或想单独强调的。最多 8 条。",
  "edit.sec3.title.placeholder": "项目名，如 involutionhell.com",
  "edit.sec3.desc.placeholder":
    "一两句说明做了什么、解决什么问题。hover 时会展开显示",
  "edit.sec3.url.placeholder": "项目链接（GitHub repo / 产品首页）",
  "edit.sec3.tags.placeholder":
    "技术栈标签，逗号分隔。例如 TypeScript, Next.js, LLM",

  // 编辑页 Section 4: Papers
  "edit.sec4.title": "SEC. 04 · PAPERS",
  "edit.sec4.heading": "最近在读 / 推荐的论文",
  "edit.sec4.description":
    "你最近读到觉得值得分享的论文（学术 / 技术博客都行）。可以填 Zotero itemKey 自动补齐信息，也可以手动填标题作者年份。不是必填，没有就留空。",
  "edit.sec4.itemKey.placeholder":
    "Zotero itemKey（可选，填了会自动拉元信息；不填就手填下面字段）",
  "edit.sec4.title.placeholder": "论文标题",
  "edit.sec4.authors.placeholder": "作者（Alice, Bob）",
  "edit.sec4.year.placeholder": "年份",
  "edit.sec4.url.placeholder": "链接",
  "edit.sec4.abstract.placeholder": "摘要或一句话评价",
} as const;

const en: Record<keyof typeof zh, string> = {
  "profile.dossier": "User Dossier",
  "profile.volumeIssue": "Vol. 1 Issue {id}",
  "profile.fullRank": "Full Rank →",
  "profile.editProfile": "Edit Profile →",
  "profile.sec.profile": "SEC. PROFILE · 001",
  "profile.stats.docs": "Docs",
  "profile.stats.commits": "Commits",
  "profile.stats.points": "Points",
  "profile.empty.title": "No projects or reading list yet.",
  "profile.empty.subtitle":
    "GitHub repos and doc contributions still shown below.",

  "follow.followers": "Followers",
  "follow.following": "Following",
  "follow.signInToFollow": "Sign in to follow",
  "follow.follow": "+ Follow",
  "follow.unfollow": "Following",

  "activity.sec": "SEC. ACTIVITY · 005",
  "activity.heading": "Activity · Last 52 Weeks",
  "activity.stats": "{days} active days · {commits} commits",
  "activity.legend.less": "Less",
  "activity.legend.more": "More",
  "activity.weekday.mon": "Mon",
  "activity.weekday.thu": "Thu",
  "activity.weekday.sat": "Sat",
  "activity.month.1": "Jan",
  "activity.month.2": "Feb",
  "activity.month.3": "Mar",
  "activity.month.4": "Apr",
  "activity.month.5": "May",
  "activity.month.6": "Jun",
  "activity.month.7": "Jul",
  "activity.month.8": "Aug",
  "activity.month.9": "Sep",
  "activity.month.10": "Oct",
  "activity.month.11": "Nov",
  "activity.month.12": "Dec",

  "repos.sec": "SEC. REPOS · 006",
  "repos.heading": "GitHub Repositories",
  "repos.subtitle": "Public repos · sorted by stars & updates",
  "repos.count": "{n} repos",

  "docs.sec": "SEC. DOCS · 007",
  "docs.heading": "Docs Contributed",
  "docs.count": "{n} docs · {commits} commits",
  "docs.showMore": "Show {n} more ↓",

  "card.kind.project": "Project",
  "card.kind.paper": "Paper",
  "card.kind.doc": "Docs",
  "card.view": "View →",

  "edit.pageTitle": "Edit Profile",
  "edit.pageHeader": "Edit · User Dossier",
  "edit.loading": "Loading...",
  "edit.auth.required": "Sign in to edit your profile.",
  "edit.auth.signIn": "Sign In →",
  "edit.auth.notYours":
    "This isn’t your profile (URL ID: {id}). Only the owner can edit.",
  "edit.auth.goMine": "Go to my profile →",
  "edit.intro.label": "About this page",
  "edit.intro.body":
    "What you put here shows up on your profile page at /u/{id}. Every field is optional — fill what you like; empty profiles still show GitHub info and contribution stats.",
  "edit.cta.save": "Save →",
  "edit.cta.saving": "Saving...",
  "edit.cta.cancel": "Cancel",
  "edit.status.saved": "Saved. Redirecting...",
  "edit.error.noToken": "Login token missing, please sign in again",
  "edit.error.http": "Save failed: HTTP {status}",
  "edit.error.unknown": "Save failed",
  "edit.section.add": "+ Add",
  "edit.section.remove": "Remove",

  "edit.sec1.title": "SEC. 01 · IDENTITY",
  "edit.sec1.heading": "About You",
  "edit.sec1.description":
    "A one-line tagline and a short bio. Shown at the top of your profile left column — think of it as your site-wide business card.",
  "edit.sec1.tagline.label": "Tagline (≤80 chars)",
  "edit.sec1.tagline.placeholder":
    "e.g. LLM Safety @ UNSW · looking for summer internships",
  "edit.sec1.bio.label": "Bio (80-200 chars recommended)",
  "edit.sec1.bio.placeholder":
    "Who you are, what you're working on, what you're interested in. e.g. CS MSc, working on alignment, writing tools on the side; happy to chat about RLHF / evals / infra.",

  "edit.sec2.title": "SEC. 02 · LINKS",
  "edit.sec2.heading": "Links",
  "edit.sec2.description":
    "External places people can reach you or learn more. Up to 5 items; shown as small buttons at the bottom of your profile left column.",
  "edit.sec2.label.placeholder": "Button label, e.g. Blog / Twitter / Zhihu",
  "edit.sec2.url.placeholder": "https://your-blog.com",

  "edit.sec3.title": "SEC. 03 · PROJECTS",
  "edit.sec3.heading": "Your Projects",
  "edit.sec3.description":
    "Personal projects / toys / open-source work. Your public GitHub repos are shown automatically below; use this for things not on GitHub or worth highlighting. Up to 8 items.",
  "edit.sec3.title.placeholder": "Project name, e.g. involutionhell.com",
  "edit.sec3.desc.placeholder":
    "1-2 sentences on what it does. Expands on hover.",
  "edit.sec3.url.placeholder": "Project URL (GitHub repo / product homepage)",
  "edit.sec3.tags.placeholder":
    "Comma-separated tech tags, e.g. TypeScript, Next.js, LLM",

  "edit.sec4.title": "SEC. 04 · PAPERS",
  "edit.sec4.heading": "Currently Reading / Recommended Papers",
  "edit.sec4.description":
    "Papers you've recently read and want to share (academic or tech-blog). Add a Zotero itemKey to auto-fill metadata, or type title / authors / year manually. Optional.",
  "edit.sec4.itemKey.placeholder":
    "Zotero itemKey (optional — auto-fills metadata; or leave empty and fill below)",
  "edit.sec4.title.placeholder": "Paper title",
  "edit.sec4.authors.placeholder": "Authors (Alice, Bob)",
  "edit.sec4.year.placeholder": "Year",
  "edit.sec4.url.placeholder": "URL",
  "edit.sec4.abstract.placeholder": "Abstract or one-line take",
};

/** 所有字典必须实现 zh 里的全部 key */
export type MessageKey = keyof typeof zh;
export type Messages = Record<MessageKey, string>;
export type Locale = "zh" | "en";

export const messagesByLocale: Record<Locale, Messages> = { zh, en };

/**
 * 取字典 + 模板参数填充。缺 key 退回 zh，再缺返回 key 本身方便定位。
 *
 * 用法：
 *   const t = (k, p) => formatMessage(locale, k, p)
 *   t("profile.stats.docs")                            // "文档贡献" / "Docs"
 *   t("activity.stats", { days: 44, commits: 237 })    // "44 天有贡献 · 合计 237 commits"
 */
export function formatMessage(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const raw =
    messagesByLocale[locale]?.[key] ?? messagesByLocale.zh[key] ?? String(key);
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return v == null ? `{${k}}` : String(v);
  });
}
