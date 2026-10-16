// Add one release object per version. Dates use YYYY-MM-DD; text pairs are [Chinese, English].
// Sections are data-driven: Added, Improved, Fixed, Removed, and Notes can be included as needed.
// The UI sorts versions and derives section counts automatically.
export const releaseNotes=[
  {
    "version": "1.1.1",
    "date": "2026-10-15",
    "summary": [
      "优化移动端布局与统计配色，修复备份导出误报。",
      "Improve mobile layouts and chart colors, and fix false backup export errors."
    ],
    "sections": [
      {
        "title": [
          "新增",
          "Added"
        ],
        "items": []
      },
      {
        "title": [
          "优化",
          "Improved"
        ],
        "items": [
          [
            "调亮每周统计柱状图配色，并随主题切换对应颜色，提升图表的清晰度与视觉体验。",
            "Brighten the weekly bar chart with theme-matched colors for improved clarity and visual appeal."
          ],
          [
            "优化专注卡片布局，状态文字显示在左上方，操作按钮在右下方横向排列，统一按钮尺寸与文字居中。",
            "Refine the focus card layout with status text at the top left and horizontally aligned action buttons at the bottom right, using consistent button sizes and centered labels."
          ],
          [
            "优化今日进度圆环的窄屏适配，避免被文字挤压变形，保持正圆显示。",
            "Improve the daily progress ring on narrow screens so nearby text cannot compress it into an oval."
          ]
        ]
      },
      {
        "title": [
          "修复",
          "Fixed"
        ],
        "items": [
          [
            "修复手机端英文科目名称过长导致卡片布局偏移的问题。",
            "Fix mobile card layout shifts caused by long English category names."
          ],
          [
            "修复历史记录长按展开后，含长英文或英文括号的标题导致卡片超出页面的问题，操作按钮在手机端改为独立一行显示。",
            "Fix record cards overflowing the screen after a long press when titles contain long English text or parentheses; action buttons now appear on a separate row on mobile."
          ],
          [
            "修复部分 Android 文件管理器保存备份后仍提示“导出失败”的问题，区分分享取消状态与实际导出错误。",
            "Fix false \"Export failed\" alerts after saving backups with some Android file managers by distinguishing canceled shares from actual export errors."
          ]
        ]
      },
      {
        "title": [
          "移除内容",
          "Removed"
        ],
        "items": []
      }
    ]
  },
  {
    "version": "1.1.0",
    "date": "2026-10-13",
    "summary": [
      "分类管理与专注体验更新。",
      "Category management and focus experience update."
    ],
    "sections": [
      {
        "title": [
          "新增",
          "Added"
        ],
        "items": [
          [
            "专注支持暂停与继续，暂停时间不计入学习时长。",
            "Pause and resume focus sessions. Paused time is excluded from study duration."
          ],
          [
            "支持编辑记录的标题、分类、日期、开始时间、时长和笔记。",
            "Edit a record’s title, category, date, start time, duration, and notes."
          ],
          [
            "新增分类管理，支持自定义名称、英文名称和颜色。",
            "Manage categories with custom names, optional English names, and colors."
          ],
          [
            "提供 10 种分类预设颜色，并保留自定义取色。",
            "Choose from ten preset category colors or select a custom color."
          ],
          [
            "支持归档与恢复分类，归档后保留历史记录和统计。",
            "Archive and restore categories while keeping their historical records and statistics."
          ],
          [
            "支持不选择分类，直接开始专注。",
            "Start a focus session without selecting a category."
          ],
          [
            "新增“暖橙”主题及橙色热力图配色。",
            "Add the Warm Orange theme and an orange heatmap palette."
          ],
          [
            "新增“关于知时”，提供更新记录、开源许可入口。",
            "Add About ZHI SHI with access to release notes and open-source licenses."
          ]
        ]
      },
      {
        "title": [
          "优化",
          "Improved"
        ],
        "items": [
          [
            "点击记录可直接查看详情，长按提供快捷管理操作。",
            "Click a record to view its details, or long-press it for quick management actions."
          ],
          [
            "完成学习改用应用内表单填写记录。",
            "Use an in-app form to save a record when a study session ends."
          ],
          [
            "归档与恢复使用应用内二次确认弹窗。",
            "Show in-app confirmation dialogs when archiving or restoring categories."
          ],
          [
            "优化表单按钮间距和弹窗布局。",
            "Improve form button spacing and dialog layouts."
          ],
          [
            "备份支持保存自定义分类、英文名称和归档状态。",
            "Preserve custom categories, English names, and archive status in backups."
          ]
        ]
      },
      {
        "title": [
          "说明",
          "Notes"
        ],
        "items": [
          [
            "删除分类后，历史记录保留并转为“未分类”。",
            "Deleting a category keeps its historical records and marks them as Uncategorized."
          ],
          [
            "更新记录使用本地静态数据，支持离线查看。",
            "Release notes use local static data and can be viewed offline."
          ]
        ]
      }
    ]
  },
  {
    "version": "1.0.0",
    "date": "2026-10-12",
    "summary": [
      "知时首个正式版本。",
      "First official release of ZHI SHI."
    ],
    "sections": [
      {
        "title": [
          "新增",
          "Added"
        ],
        "items": [
          [
            "支持学习专注计时，学习过程中隐藏时长，结束后展示结果。",
            "Track focused study time with the duration hidden during a session and shown when it ends."
          ],
          [
            "提供数学、英语、专业课、政治四个固定分类。",
            "Choose from four built-in categories: Mathematics, English, Major, and Politics."
          ],
          [
            "支持填写学习标题和笔记，保存日期、开始时间及学习时长。",
            "Add a study title and notes, and save the date, start time, and duration."
          ],
          [
            "支持按日期查看记录，搜索标题或笔记。",
            "Browse records by date and search titles or notes."
          ],
          [
            "长按记录可查看单次详情或删除记录。",
            "Long-press a record to view its details or delete it."
          ],
          [
            "提供每日学习目标、今日进度、近 7 天趋势、科目分布和 13 周热力图。",
            "View daily study goals, today’s progress, seven-day trends, subject distribution, and a 13-week activity heatmap."
          ],
          [
            "支持中英文切换及五种主题配色。",
            "Switch between Chinese and English and choose from five color themes."
          ],
          [
            "支持本地用户名和头像编辑。",
            "Edit your local display name and avatar."
          ],
          [
            "支持 JSON 备份导出、覆盖导入及合并去重。",
            "Export JSON backups, replace existing data on import, or merge records with duplicate removal."
          ],
          [
            "支持网页、PWA 和 Android APK，能够离线使用。",
            "Use the app offline on the web, as a PWA, or through an Android APK."
          ]
        ]
      },
      {
        "title": [
          "优化",
          "Improved"
        ],
        "items": [
          [
            "不足 25 分钟结束时增加二次确认，减少误操作。",
            "Confirm before ending a session shorter than 25 minutes to help prevent accidental exits."
          ],
          [
            "优化确认按钮布局和头像编辑入口。",
            "Improve confirmation button layouts and access to avatar editing."
          ],
          [
            "改进 Android 数据导出与分享体验",
            "Improve data export and sharing on Android."
          ]
        ]
      },
      {
        "title": [
          "说明",
          "Notes"
        ],
        "items": [
          [
            "学习数据保存在本机，无需注册账号。",
            "Study data is stored on your device. No account is required."
          ],
          [
            "不足 25 分钟的专注不会保存为学习记录",
            "Focus sessions shorter than 25 minutes are not saved as study records."
          ],
          [
            "该版本基于 2026 年 8 月 15 日完成的初版整理而成，作为后续 1.x 系列开发的基准版本。",
            "This release builds on the initial version completed on August 15, 2026, and serves as the baseline for the 1.x series."
          ]
        ]
      }
    ]
  }
];
