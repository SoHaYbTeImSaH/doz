# بازی دوز 4 سو آنلاین

یک بازی دوز 4 سو آنلاین با قابلیت بازی چند نفره و هوش مصنوعی.

## 🎮 بازی آنلاین
برای بازی آنلاین به این آدرس بروید:
[بازی دوز 4 سو آنلاین](https://sohaybteimsah.github.io/doz)

## ویژگی‌ها

- 🎮 بازی دو نفره آنلاین
- 🤖 بازی با هوش مصنوعی
- 👤 سیستم ثبت‌نام و ورود
- 🏆 سیستم امتیازدهی
- 📱 طراحی واکنش‌گرا
- 🎨 رابط کاربری مدرن

## پیش‌نیازها

- Node.js (نسخه 14 یا بالاتر)
- MongoDB
- npm یا yarn

## نصب و راه‌اندازی

1. ابتدا پروژه را کلون کنید:
```bash
git clone https://github.com/SoHaYbTeImSaH/doz.git
cd doz
```

2. نصب وابستگی‌ها:
```bash
npm install
```

3. فایل `.env` را در روت پروژه ایجاد کنید و متغیرهای محیطی زیر را تنظیم کنید:
```env
MONGODB_URI=mongodb://localhost:27017/connect4
PORT=3000
JWT_SECRET=your-secret-key
```

4. اطمینان حاصل کنید که MongoDB در حال اجراست.

5. سرور را اجرا کنید:
```bash
npm start
```

برای توسعه:
```bash
npm run dev
```

6. در مرورگر خود به آدرس `http://localhost:3000` بروید.

## ساختار پروژه

```
connect4-online/
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js
├── package.json
└── README.md
```

## تکنولوژی‌های استفاده شده

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Real-time: Socket.IO
- Authentication: JWT

## مشارکت

1. پروژه را fork کنید
2. یک branch جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات خود را commit کنید (`git commit -m 'Add some amazing feature'`)
4. به branch خود push کنید (`git push origin feature/amazing-feature`)
5. یک Pull Request ایجاد کنید

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای اطلاعات بیشتر فایل `LICENSE` را مشاهده کنید.

## تماس با ما

برای گزارش مشکلات یا پیشنهادات، لطفاً یک issue ایجاد کنید. 