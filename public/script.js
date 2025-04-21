class Game {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(''));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.vsAI = false;
        this.moveHistory = [];
        this.scores = { red: 0, yellow: 0 };
        this.socket = null;
        this.gameId = null;
        this.userId = null;
        this.init();
    }

    init() {
        this.createBoard();
        this.updateStatus();
        this.setupEventListeners();
        this.setupSocket();
    }

    setupSocket() {
        this.socket = io();
        
        this.socket.on('waiting', () => {
            this.updateStatus('در انتظار بازیکن دیگر...');
        });

        this.socket.on('gameFound', ({ gameId, color }) => {
            this.gameId = gameId;
            this.currentPlayer = color;
            this.updateStatus(`بازی شروع شد! شما ${color === 'red' ? 'قرمز' : 'زرد'} هستید`);
        });

        this.socket.on('moveMade', ({ row, col, currentPlayer }) => {
            this.board[row][col] = currentPlayer === 0 ? 'red' : 'yellow';
            this.updateCell(row, col);
            this.currentPlayer = currentPlayer === 0 ? 'red' : 'yellow';
            this.updateStatus();
        });

        this.socket.on('gameOver', ({ winner }) => {
            this.gameOver = true;
            if (winner === this.userId) {
                this.scores.yellow++;
            } else {
                this.scores.red++;
            }
            this.updateScores();
            this.showWinModal(winner === this.userId ? 'شما برنده شدید!' : 'بازیکن دیگر برنده شد!');
        });
    }

    setupEventListeners() {
        document.getElementById('reset').addEventListener('click', () => this.reset());
        document.getElementById('undo').addEventListener('click', () => this.undoMove());
        document.getElementById('vs-ai').addEventListener('click', () => this.setGameMode(true));
        document.getElementById('vs-player').addEventListener('click', () => this.setGameMode(false));
        document.getElementById('new-game').addEventListener('click', () => this.reset());
        document.getElementById('find-game').addEventListener('click', () => this.findGame());
    }

    findGame() {
        if (!this.userId) {
            alert('لطفا ابتدا وارد شوید');
            return;
        }
        this.socket.emit('findGame', this.userId);
    }

    makeMove(col) {
        if (this.gameOver) return;

        const row = this.getLowestEmptyRow(col);
        if (row === -1) return;

        if (this.vsAI) {
            this.moveHistory.push({ row, col, player: this.currentPlayer });
            this.board[row][col] = this.currentPlayer;
            this.updateCell(row, col);

            if (this.checkWin(row, col)) {
                this.gameOver = true;
                this.scores[this.currentPlayer]++;
                this.updateScores();
                this.showWinModal(`${this.currentPlayer === 'red' ? 'قرمز' : 'زرد'} برنده شد!`);
                return;
            }

            if (this.checkDraw()) {
                this.gameOver = true;
                this.showWinModal('بازی مساوی شد!');
                return;
            }

            this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
            this.updateStatus();

            if (this.vsAI && this.currentPlayer === 'yellow') {
                setTimeout(() => this.makeAIMove(), 500);
            }
        } else {
            if (this.gameId && this.currentPlayer === (this.userId === this.socket.id ? 'red' : 'yellow')) {
                this.socket.emit('makeMove', { gameId: this.gameId, userId: this.userId, col });
            }
        }
    }

    // ... rest of the existing code ...
}

// شروع بازی
const game = new Game();

// مدیریت مودال‌ها
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const winModal = document.getElementById('win-modal');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const closeBtns = document.querySelectorAll('.close-modal');

// نمایش مودال ورود
loginBtn.addEventListener('click', () => {
    loginModal.classList.add('show');
});

// نمایش مودال ثبت‌نام
registerBtn.addEventListener('click', () => {
    registerModal.classList.add('show');
});

// بستن مودال‌ها
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.classList.remove('show');
        registerModal.classList.remove('show');
        winModal.classList.remove('show');
    });
});

// بستن مودال با کلیک خارج از آن
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('show');
    }
    if (e.target === registerModal) {
        registerModal.classList.remove('show');
    }
    if (e.target === winModal) {
        winModal.classList.remove('show');
    }
});

// مدیریت فرم ورود
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('input[name="username"]').value;
    const password = loginForm.querySelector('input[name="password"]').value;
    
    // اینجا می‌توانید کد مربوط به ارسال اطلاعات به سرور را اضافه کنید
    console.log('ورود با:', { username, password });
    
    loginModal.classList.remove('show');
});

// مدیریت فرم ثبت‌نام
const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = registerForm.querySelector('input[name="username"]').value;
    const password = registerForm.querySelector('input[name="password"]').value;
    
    // اینجا می‌توانید کد مربوط به ارسال اطلاعات به سرور را اضافه کنید
    console.log('ثبت‌نام با:', { username, password });
    
    registerModal.classList.remove('show');
});

// نمایش مودال برنده شدن
function showWinModal(winner) {
    const winMessage = document.querySelector('#win-modal h2');
    winMessage.textContent = `بازیکن ${winner} برنده شد!`;
    winModal.classList.add('show');
}

// شروع بازی جدید
document.getElementById('new-game-btn').addEventListener('click', () => {
    winModal.classList.remove('show');
    resetGame();
}); 