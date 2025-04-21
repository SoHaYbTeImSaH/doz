require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// اتصال به دیتابیس
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connect4', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// مدل کاربر
const User = mongoose.model('User', {
    username: String,
    password: String,
    score: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// مدل بازی
const Game = mongoose.model('Game', {
    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        color: String
    }],
    board: Array,
    currentPlayer: Number,
    status: String,
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// میدلور‌ها
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسیرهای API
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'کاربر با موفقیت ثبت نام شد' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            throw new Error('نام کاربری یا رمز عبور اشتباه است');
        }
        res.json({ userId: user._id, username: user.username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// مدیریت اتصالات Socket.IO
const waitingPlayers = new Map();
const activeGames = new Map();

io.on('connection', (socket) => {
    console.log('کاربر جدید متصل شد');

    socket.on('findGame', (userId) => {
        if (waitingPlayers.size > 0) {
            const [waitingUserId, waitingSocket] = waitingPlayers.entries().next().value;
            waitingPlayers.delete(waitingUserId);
            
            // ایجاد بازی جدید
            const gameId = Math.random().toString(36).substring(7);
            const game = {
                players: [waitingUserId, userId],
                currentPlayer: 0,
                board: Array(6).fill().map(() => Array(7).fill('')),
                status: 'active'
            };
            
            activeGames.set(gameId, game);
            
            // اطلاع‌رسانی به هر دو بازیکن
            waitingSocket.emit('gameFound', { gameId, color: 'red' });
            socket.emit('gameFound', { gameId, color: 'yellow' });
        } else {
            waitingPlayers.set(userId, socket);
            socket.emit('waiting');
        }
    });

    socket.on('makeMove', ({ gameId, userId, col }) => {
        const game = activeGames.get(gameId);
        if (!game) return;

        const row = getLowestEmptyRow(game.board, col);
        if (row === -1) return;

        game.board[row][col] = game.players.indexOf(userId) === 0 ? 'red' : 'yellow';
        
        // بررسی برنده
        if (checkWin(game.board, row, col)) {
            game.status = 'finished';
            game.winner = userId;
            io.to(gameId).emit('gameOver', { winner: userId });
            updateScores(userId, game.players.find(p => p !== userId));
        } else {
            game.currentPlayer = (game.currentPlayer + 1) % 2;
            io.to(gameId).emit('moveMade', { row, col, currentPlayer: game.currentPlayer });
        }
    });

    socket.on('disconnect', () => {
        // پاک کردن از لیست انتظار
        for (const [userId, socket] of waitingPlayers.entries()) {
            if (socket === socket) {
                waitingPlayers.delete(userId);
                break;
            }
        }
    });
});

// توابع کمکی
function getLowestEmptyRow(board, col) {
    for (let row = board.length - 1; row >= 0; row--) {
        if (board[row][col] === '') {
            return row;
        }
    }
    return -1;
}

function checkWin(board, row, col) {
    const directions = [
        [[0, 1], [0, -1]], // افقی
        [[1, 0], [-1, 0]], // عمودی
        [[1, 1], [-1, -1]], // مورب
        [[1, -1], [-1, 1]] // مورب معکوس
    ];

    const color = board[row][col];
    
    return directions.some(dir => {
        let count = 1;
        for (const [dx, dy] of dir) {
            let r = row + dx;
            let c = col + dy;
            while (
                r >= 0 && r < board.length &&
                c >= 0 && c < board[0].length &&
                board[r][c] === color
            ) {
                count++;
                r += dx;
                c += dy;
            }
        }
        return count >= 4;
    });
}

async function updateScores(winnerId, loserId) {
    await User.findByIdAndUpdate(winnerId, {
        $inc: { score: 10, wins: 1 }
    });
    await User.findByIdAndUpdate(loserId, {
        $inc: { score: -5, losses: 1 }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`سرور در پورت ${PORT} در حال اجراست`);
}); 