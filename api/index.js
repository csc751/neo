require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// SMTP 配置（通过环境变量注入）
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// 仅在本地开发时测试 SMTP 连接，Vercel 环境下跳过避免冷启动耗时
if (!process.env.VERCEL) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('SMTP 连接失败:', error);
        } else {
            console.log('SMTP 连接成功，可以发邮件了');
        }
    });
}

// 接收前端的订单请求并发送邮件
app.post('/send-order', async (req, res) => {
    const { userName, orderName } = req.body;

    if (!userName || !orderName) {
        return res.status(400).json({ success: false, message: '参数不全' });
    }

    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'NEO8电竞点单系统'}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
        to: process.env.MAIL_TO || process.env.SMTP_USER,
        subject: '新订单通知',
        text: `用户: ${userName}\n订单: ${orderName}`,
        html: `<p>用户: <strong>${userName}</strong></p><p>订单: <strong>${orderName}</strong></p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: '邮件发送成功' });
    } catch (error) {
        console.error('邮件发送失败:', error);
        res.status(500).json({ success: false, message: '邮件发送失败' });
    }
});

module.exports = app;
