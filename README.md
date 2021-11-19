# reindeer-comic

漫画浏览器
* 拖拽漫画到主界面加入漫画
* 支持本地/局域网漫画漫画
* 支持图片文件夹和zip包漫画书
* 支持 ctrl+t 切换主题
* 浏览漫画界面使用 esc 返回主界面
* webtoon风格浏览漫画


## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn run electron:serve
```

### Compiles and minifies for production
```
yarn run electron:build
```

### Lints and fixes files
```
yarn lint
```
### Change log

## [1.2.1]
- 将windows 版的数据文件存放位置更改到用户目录下，防止升级时被覆盖

## [1.2.0]
- 数据存储更改为neDB
- 自动将老版本的存储转换为新存储

## [1.1.0]
- 自定义标签
- 搜索标题及标签

## [1.0.0] 2021-11-15
- 支持 windows 及 mac 平台
- 漫画支持拖拽导入
- 支持无密码zip包及文件夹漫画倒入
- ctrl+t切换明暗主题
- webtoon 风格浏览漫画
