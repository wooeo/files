require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const basicAuth = require('express-basic-auth');
const iconv = require('iconv-lite');
const app = express();

const PORT = process.env.PORT || 9999;
const USERNAME = process.env.USERNAME || 'admin';
const PASSWOORD = process.env.PASSWOORD || 'admin';

const FILES_DIR = path.join(__dirname, 'files');

// 确保 files 目录存在
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR);
    console.log(`Created directory: ${FILES_DIR}`);
}

// 安全验证文件名
function sanitizeFilename(filename) {
    const decoded = decodeURIComponent(filename);
    // 防止目录遍历攻击
    if (decoded.includes('../') || decoded.includes('..\\')) {
        throw new Error('Invalid filename: path traversal detected');
    }
    // 防止空文件名
    if (!decoded || decoded.trim() === '') {
        throw new Error('Invalid filename: empty filename');
    }
    return decoded;
}

// Basic Auth 配置
const authMiddleware = basicAuth({
    users: { [USERNAME]: PASSWOORD },
    challenge: true,
    unauthorizedResponse: 'Unauthorized Access'
});

// 文件存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, FILES_DIR);
    },
    filename: (req, file, cb) => {
        let filename = file.originalname;
        let rawName = filename;
    
        try {
            // 原始上传可能是 latin1 或 binary 解码成的乱码，尝试还原为 buffer 再用 gbk 解
            const buffer = Buffer.from(filename, 'latin1'); // 或 'binary'
            const decoded = iconv.decode(buffer, 'gbk');
    
            // console.log('转码后文件名:', decoded);
            filename = decoded;
        } catch (e) {
            console.warn('文件名转码失败:', e.message);
        }
    
        cb(null, filename);
    }    
});
const upload = multer({ storage });

// 获取文件列表
app.get('/api/files', authMiddleware, (req, res) => {
    fs.readdir(FILES_DIR, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read directory' });
        }

        const fileList = files.map(file => {
            let name = file.name;
            // Windows下如果文件名乱码，尝试GBK转码
            if (Buffer.isBuffer(name)) {
                name = iconv.decode(name, 'gbk');
            }
            const filePath = path.join(FILES_DIR, name);
            const stats = fs.statSync(filePath);
            return {
                name,
                size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                lastModified: stats.mtime,
                downloadUrl: `${req.protocol}://${req.get('host')}/download/${encodeURIComponent(name)}`
            };
        });

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(fileList, null, 2));
    });
});

// 文件直链下载
app.get('/download/:filename', (req, res) => {
    try {
        const filename = sanitizeFilename(req.params.filename);
        const filePath = path.join(FILES_DIR, filename);
        if (fs.existsSync(filePath)) {
            res.download(filePath, filename, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    if (!res.headersSent) {
                        res.status(500).send('Download failed');
                    }
                }
            });
        } else {
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(400).send(error.message);
    }
});

// 文件上传
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    let newName = req.file.originalname;

    if (req.body.filename) {
        try {
            // 直接 base64 解码为 utf8
            newName = Buffer.from(req.body.filename, 'base64').toString('utf8');
            const oldPath = path.join(FILES_DIR, req.file.filename);
            const newPath = path.join(FILES_DIR, newName);
            fs.renameSync(oldPath, newPath);
        } catch (e) {
            console.warn('文件名解码失败:', e.message);
        }
    }

    res.json({
        message: '上传成功',
        file: newName,
        downloadUrl: `${req.protocol}://${req.get('host')}/download/${encodeURIComponent(newName)}`
    });
});


// 文件删除
app.delete('/api/files/:filename', authMiddleware, (req, res) => {
    try {
        const filename = sanitizeFilename(req.params.filename);
        const filePath = path.join(FILES_DIR, filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Delete error:', err);
                    return res.status(500).json({ error: 'Failed to delete file' });
                }
                res.json({ message: 'File deleted successfully' });
            });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(400).json({ error: error.message });
    }
});

// 静态资源
app.use(authMiddleware, express.static(path.join(__dirname, 'public')));

// 首页路由
app.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log('Environment variables loaded:', {
        PORT: process.env.PORT,
        USERNAME: process.env.USERNAME ? 'set' : 'using default',
        PASSWOORD: process.env.PASSWOORD ? 'set' : 'using default'
    });
    console.log(`Files directory: ${FILES_DIR}`);
    console.log(`Basic Auth credentials: ${USERNAME}/${PASSWOORD}`);
    console.log(`Server is running on http://localhost:${PORT}`);
});
