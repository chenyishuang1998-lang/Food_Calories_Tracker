# 今天吃啥 🍜

记录每天吃啥，轻松追踪卡路里的 PWA 应用。

## 功能

- 📝 按早餐/午餐/晚餐/零食分类记录食物和卡路里
- 📷 拍照 AI 自动识别食物和卡路里（需要 Anthropic API Key）
- 📊 每日卡路里进度环形图
- 📅 支持查看历史日期
- 📱 支持安装到手机主屏幕（PWA）
- 🔒 数据全部存在本地，不上传

---

## 部署到 Vercel（免费）

### 第一步：上传到 GitHub

1. 打开 [github.com](https://github.com)，登录或注册账号
2. 点右上角 **+** → **New repository**
3. 填写名称（例：`food-tracker`），点 **Create repository**
4. 把这个文件夹里的所有文件上传上去（可以直接拖拽到页面）

### 第二步：部署到 Vercel

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点 **Add New → Project**
3. 选择刚才创建的 `food-tracker` 仓库
4. 点 **Deploy**，等 1 分钟
5. 🎉 完成！会自动分配一个网址，例如 `food-tracker.vercel.app`

### 第三步：手机安装

**iPhone：**
1. 用 Safari 打开网址
2. 点底部分享按钮 → **添加到主屏幕**
3. 点**添加**，就会出现 app 图标

**Android：**
1. 用 Chrome 打开网址
2. 点右上角菜单 → **添加到主屏幕**
3. 搞定！

---

## 拍照识别功能

需要 Anthropic API Key：

1. 打开 [console.anthropic.com](https://console.anthropic.com)
2. 注册/登录，进入 **API Keys** 页面
3. 点 **Create Key**，复制 Key（格式：`sk-ant-...`）
4. 打开 app，在顶部输入框粘贴 Key，点**保存**
5. 之后就可以拍照自动识别了

> Key 只保存在你的手机本地，不会被发送到任何第三方服务器。

---

## 本地开发

直接用浏览器打开 `index.html` 即可，不需要任何构建工具。
