# 知时 · 学习记录

一个可离线使用的个人学习记录应用，支持 Android APK 与可安装 PWA。

## 功能

- 数学、英语、专业课和政治分类计时
- 少于 25 分钟的学习不计入记录
- 今日目标、历史记录、趋势和学习活跃度热力图
- 单条记录删除
- 中文、英文界面切换
- 默认绿、哔站粉、YouTube 红、哔站蓝和苹果白主题
- JSON 备份导出、格式校验、合并或覆盖导入
- 导入时自动排除重复记录

## 网页运行

```powershell
python -m http.server 4173
```

打开 `http://127.0.0.1:4173`。

## Android 构建

安装 Java 21 和 Android SDK 36 后运行：

```powershell
npm install
npm run android:build
```

APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`。

## 数据说明

学习数据保存在当前浏览器或 Android 应用的本地存储中。更换设备前请在“我的”页面导出 JSON 备份。
