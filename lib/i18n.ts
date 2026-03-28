export type Locale = "en" | "zh-HK";

export const translations = {
  en: {
    // Nav
    nav_dashboard:  "Dashboard",
    nav_teams:      "Teams",
    nav_products:   "Products",
    nav_issues:     "Issues",
    nav_logs:       "Logs",
    nav_mcp:        "Tools",
    nav_board:      "Board",
    nav_schedule:   "Schedule",
    nav_about:      "About",

    // Sidebar sections
    section_projects: "Projects",
    section_products: "Products",
    section_agents:   "Agents",
    section_company:  "Company",

    // Agent status
    agent_live:   "live",
    agent_idle:   "Idle",

    // Dashboard
    page_dashboard:       "Dashboard",
    dashboard_subtitle:   "Whitebox — Local",
    metric_active_projects: "Active Projects",
    metric_total_tracked:   "total tracked",
    metric_decisions_today: "Decisions Today",
    metric_total:           "total",
    metric_open_tasks:      "Open Tasks",
    metric_in_progress:     "in progress",

    // Board
    page_board:    "Board",
    board_github:  "GitHub",
    board_items:   "items",
    board_empty:   "Empty",
    no_token:      "No GITHUB_TOKEN — set it in .env.local to fetch project boards",
    board_error:   "Could not load board",

    // Status labels
    status_todo:        "Todo",
    status_in_progress: "In Progress",
    status_done:        "Done",

    // Issues page
    page_issues:    "Issues",
    issues_open:    "Open",
    issues_closed:  "Closed",
    issues_all:     "All",
    issues_todo:    "Todo",
    issues_inprog:  "In Progress",
    issues_done:    "Done",
    issues_empty:   "No tasks found",

    // Logs page
    page_logs:            "Logs",
    logs_activity:        "Activity",
    logs_loop:            "Loop Log",
    logs_decisions:       "Decisions",
    logs_empty:           "No entries yet",

    // Schedule page
    page_schedule:        "Schedule",
    schedule_crons:       "Cron Jobs",
    schedule_loop:        "Loop History",
    schedule_empty:       "No cron jobs found",
    schedule_loop_empty:  "No loop history yet",

    // About page
    page_about:           "About",
    about_agents:         "Agents",
    about_phases:         "Phases",
    about_infra:          "Infrastructure",
    about_commands:       "Slash Commands",

    // Products page
    page_products:        "Products",
    products_board:       "Project Board",
    products_repos:       "Repos",

    // Quota card
    quota_5h:       "5h Quota",
    quota_7d:       "7d Quota",
    quota_resets:   "resets in",
    quota_live:     "live",
    quota_stale:    "ago",

    // Sessions
    sessions_title:   "Live Sessions",
    sessions_empty:   "No active Claude sessions",
    session_cpu:      "CPU",
    session_elapsed:  "elapsed",

    // Misc
    open_github:  "Open on GitHub",
    loading:      "Loading…",
    no_data:      "No data",
    lang_toggle:  "廣東話",
  },

  "zh-HK": {
    // Nav
    nav_dashboard:  "主頁",
    nav_teams:      "團隊",
    nav_products:   "產品",
    nav_issues:     "任務",
    nav_logs:       "日誌",
    nav_mcp:        "工具",
    nav_board:      "看板",
    nav_schedule:   "排程",
    nav_about:      "關於",

    // Sidebar sections
    section_projects: "項目",
    section_products: "產品",
    section_agents:   "代理人",
    section_company:  "公司",

    // Agent status
    agent_live:   "運行中",
    agent_idle:   "空閒",

    // Dashboard
    page_dashboard:       "主頁",
    dashboard_subtitle:   "Whitebox — 本地",
    metric_active_projects: "活躍項目",
    metric_total_tracked:   "個項目追蹤中",
    metric_decisions_today: "今日決策",
    metric_total:           "個總計",
    metric_open_tasks:      "待辦任務",
    metric_in_progress:     "進行中",

    // Board
    page_board:    "看板",
    board_github:  "GitHub",
    board_items:   "個項目",
    board_empty:   "空",
    no_token:      "未設定 GITHUB_TOKEN — 請在 .env.local 中設定以載入項目看板",
    board_error:   "無法載入看板",

    // Status labels
    status_todo:        "待辦",
    status_in_progress: "進行中",
    status_done:        "完成",

    // Issues page
    page_issues:    "任務",
    issues_open:    "開放",
    issues_closed:  "已關閉",
    issues_all:     "全部",
    issues_todo:    "待辦",
    issues_inprog:  "進行中",
    issues_done:    "完成",
    issues_empty:   "未找到任務",

    // Logs page
    page_logs:            "日誌",
    logs_activity:        "活動",
    logs_loop:            "循環日誌",
    logs_decisions:       "決策",
    logs_empty:           "暫無記錄",

    // Schedule page
    page_schedule:        "排程",
    schedule_crons:       "定時任務",
    schedule_loop:        "循環歷史",
    schedule_empty:       "未找到定時任務",
    schedule_loop_empty:  "暫無循環歷史",

    // About page
    page_about:           "關於",
    about_agents:         "代理人",
    about_phases:         "階段",
    about_infra:          "基礎設施",
    about_commands:       "指令",

    // Products page
    page_products:        "產品",
    products_board:       "項目看板",
    products_repos:       "代碼庫",

    // Quota card
    quota_5h:       "5小時配額",
    quota_7d:       "7天配額",
    quota_resets:   "重置於",
    quota_live:     "即時",
    quota_stale:    "前",

    // Sessions
    sessions_title:   "即時工作階段",
    sessions_empty:   "無活躍 Claude 工作階段",
    session_cpu:      "CPU",
    session_elapsed:  "已用時",

    // Misc
    open_github:  "在 GitHub 上開啟",
    loading:      "載入中…",
    no_data:      "無數據",
    lang_toggle:  "English",
  },
} satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;
