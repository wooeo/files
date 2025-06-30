# File System

## 项目简介

File System 是一个简洁高效的文件管理系统，支持文件上传、下载、重命名、移动、删除等操作，适合个人和团队在本地或云端搭建私有文件服务，生成直链预览图片，视频，音频等，支持api获取文件直链链接

## 主要功能
- 多目录分类管理（视频、音频、图片、文档、其他）
- 文件/文件夹上传、下载、重命名、移动、删除
- 支持批量操作
- 支持目录递归浏览
- api操作数据
- 支持基础认证（用户名/密码）
- 支持 Docker 一键部署与持久化

## 环境变量

| 变量名    | 说明               | 默认值   |
|-----------|--------------------|----------|
| PORT      | 服务监听端口       | 9999     |
| USERNAME  | 登录用户名         | admin    |
| PASSWORD  | 登录密码          | admin    |

## 源代码部署

1. 克隆项目
   ```bash
   git clone https://github.com/eooce/file-system.git
   cd file-system
   ```
2. 安装依赖
   ```bash
   npm install
   ```
3. 启动服务
   ```bash
   npm start
   ```
4. 默认访问地址： [http://localhost:9999](http://localhost:9999)
   - 默认用户名/密码：`admin` / `admin`

## Docker 部署
```
ghcr.io/eooce/file-system:latest
```

### 1. 直接运行
```bash
docker run -d \
  --name file-system \
  -p 9999:9999 \
  -v /app/files:/app/files \
  ghcr.io/eooce/file-system:latest
```
- 说明：将主机目录 `/app/files` 挂载到容器内 `/app/files`，实现数据持久化。

### 2. docker-compose 部署

新建 `docker-compose.yml`：
```yaml
version: '3'
services:
  file-system:
    image: ghcr.io/eooce/file-system:latest
    container_name: file-system
    ports:
      - "9999:9999"
    volumes:
      - ./files:/app/files
    environment:
      - USERNAME=admin
      - PASSWORD=admin
    restart: unless-stopped
```
- 说明：当前目录下的 `./files` 会作为持久化目录挂载到容器内 `/app/files`。

启动服务：
```bash
docker-compose up -d
```

## 访问方式
- 浏览器访问：[http://localhost:9999](http://localhost:9999)
- 默认用户名/密码：`admin` / `admin`


## API 说明

### 1. 获取文件列表
- `GET /api/files`
  - 获取根目录下所有文件和文件夹。
- `GET /api/files?subdir=xxx`
  - 获取指定目录（如 videos、pictures 等）下的所有文件和文件夹。

#### 响应示例：
```json
[
  {
    "name": "test.jpg",
    "subdir": "pictures",
    "isDirectory": false,
    "size": "1.23 MB",
    "lastModified": "2024-06-29T12:34:56.789Z",
    "downloadUrl": "http://host/download/pictures/test.jpg"
  },
  ...
]
```

### 2. 上传文件
- `POST /api/upload?subdir=xxx`
  - 表单字段：`file`（支持多文件），可选 `relativePath`（用于文件夹上传）
  - 响应：上传成功信息及下载链接

### 3. 下载文件
- `GET /download/相对路径`
  - 例：`/download/pictures/test.jpg`

### 4. 重命名文件
- `PUT /api/files/rename`
  - JSON 参数：`{"oldPath": "pictures/test.jpg", "newName": "new.jpg"}`
  - 响应：重命名结果

### 5. 移动文件
- `PUT /api/files/move`
  - JSON 参数：`{"oldPath": "pictures/test.jpg", "targetDir": "videos"}`
  - 响应：移动结果

### 6. 删除文件/文件夹
- `DELETE /api/files/相对路径`
  - 例：`/api/files/pictures/test.jpg`
  - 响应：删除结果

### 7. 获取所有子目录
- `GET /api/subdirs`
  - 响应：`["videos", "audios", "pictures", "documents", "others"]`


## 协议

本项目基于 [MIT License](./LICENSE) 开源，欢迎自由使用和二次开发。

---

如需更多接口或自定义开发，欢迎参考源码或提交 issue。 
