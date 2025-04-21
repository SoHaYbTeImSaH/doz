class Game {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(''));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.vsAI = true;
        this.moveHistory = [];
        this.scores = { red: 0, yellow: 0 };
        this.aiPlayer = new AIPlayer();
        this.init();
    }

    init() {
        this.createBoard();
        this.updateStatus();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('reset').addEventListener('click', () => this.reset());
        document.getElementById('undo').addEventListener('click', () => this.undoMove());
        document.getElementById('vs-ai').addEventListener('click', () => this.setGameMode(true));
        document.getElementById('vs-player').addEventListener('click', () => this.setGameMode(false));
        document.getElementById('new-game').addEventListener('click', () => this.reset());
    }

    setGameMode(vsAI) {
        this.vsAI = vsAI;
        document.getElementById('vs-ai').classList.toggle('active', vsAI);
        document.getElementById('vs-player').classList.toggle('active', !vsAI);
        this.reset();
    }

    createBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.makeMove(j));
                boardElement.appendChild(cell);
            }
        }
    }

    makeMove(col) {
        if (this.gameOver) return;

        const row = this.getLowestEmptyRow(col);
        if (row === -1) return;

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
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.gameOver) return;

        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = '';
        this.updateCell(lastMove.row, lastMove.col);
        this.currentPlayer = lastMove.player;
        this.gameOver = false;
        this.updateStatus();
    }

    makeAIMove() {
        if (this.gameOver) return;

        const col = this.aiPlayer.makeMove(this.board);
        if (col !== -1) {
            this.makeMove(col);
        }
    }

    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (!this.board[row][col]) {
                return row;
            }
        }
        return -1;
    }

    updateCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.className = 'cell';
        if (this.board[row][col]) {
            cell.classList.add(this.board[row][col]);
        }
    }

    updateStatus() {
        document.getElementById('status').textContent = `نوبت بازیکن: ${this.currentPlayer === 'red' ? 'قرمز' : 'زرد'}`;
    }

    updateScores() {
        document.querySelector('.red-score .score-value').textContent = this.scores.red;
        document.querySelector('.yellow-score .score-value').textContent = this.scores.yellow;
    }

    showWinModal(message) {
        const modal = document.getElementById('win-modal');
        document.getElementById('win-message').textContent = message;
        modal.classList.add('show');
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]], // افقی
            [[1, 0], [-1, 0]], // عمودی
            [[1, 1], [-1, -1]], // مورب
            [[1, -1], [-1, 1]] // مورب معکوس
        ];

        return directions.some(dir => {
            const count = 1 + this.countDirection(row, col, dir[0]) + this.countDirection(row, col, dir[1]);
            return count >= 4;
        });
    }

    countDirection(row, col, [dx, dy]) {
        let count = 0;
        let x = row + dx;
        let y = col + dy;

        while (
            x >= 0 && x < this.rows &&
            y >= 0 && y < this.cols &&
            this.board[x][y] === this.currentPlayer
        ) {
            count++;
            x += dx;
            y += dy;
        }

        return count;
    }

    checkDraw() {
        return this.board.every(row => row.every(cell => cell !== ''));
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(''));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.moveHistory = [];
        this.createBoard();
        this.updateStatus();
        document.getElementById('win-modal').classList.remove('show');
    }
}

class AIPlayer {
    constructor(difficulty = 'hard') {
        this.difficulty = difficulty;
        this.maxDepth = difficulty === 'hard' ? 6 : 4;
        this.weights = {
            center: 3,
            adjacent: 2,
            blocking: 4,
            winning: 1000,
            potential: 5
        };
    }

    makeMove(board) {
        const startTime = performance.now();
        const move = this.findBestMove(board);
        const endTime = performance.now();
        console.log(`AI move took ${(endTime - startTime).toFixed(2)}ms`);
        return move;
    }

    findBestMove(board) {
        let bestScore = -Infinity;
        let bestMove = null;
        const validMoves = this.getValidMoves(board);
        
        if (validMoves.length === 0) return -1;
        
        // اولویت‌بندی حرکت‌ها برای جستجوی سریع‌تر
        const prioritizedMoves = this.prioritizeMoves(board, validMoves);
        
        for (const col of prioritizedMoves) {
            const row = this.getLowestEmptyRow(board, col);
            if (row === -1) continue;
            
            board[row][col] = 'yellow';
            const score = this.minimax(board, this.maxDepth, false, -Infinity, Infinity);
            board[row][col] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = col;
            }
        }
        
        return bestMove;
    }

    prioritizeMoves(board, moves) {
        return moves.sort((a, b) => {
            const scoreA = this.evaluateMove(board, a);
            const scoreB = this.evaluateMove(board, b);
            return scoreB - scoreA;
        });
    }

    evaluateMove(board, col) {
        const row = this.getLowestEmptyRow(board, col);
        if (row === -1) return -Infinity;
        
        let score = 0;
        
        // ارزیابی مرکز صفحه
        const centerCol = Math.floor(board[0].length / 2);
        score += this.weights.center * (1 - Math.abs(col - centerCol) / centerCol);
        
        // ارزیابی مهره‌های مجاور
        score += this.evaluateAdjacent(board, row, col);
        
        // ارزیابی پتانسیل برد
        score += this.evaluatePotential(board, row, col);
        
        return score;
    }

    evaluateAdjacent(board, row, col) {
        let score = 0;
        const directions = [
            [-1, 0], [1, 0],  // عمودی
            [0, -1], [0, 1],  // افقی
            [-1, -1], [1, 1], // مورب
            [-1, 1], [1, -1]  // مورب
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            let blocked = 0;
            
            // بررسی در یک جهت
            for (let i = 1; i <= 3; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                
                if (this.isValidPosition(board, newRow, newCol)) {
                    if (board[newRow][newCol] === 'yellow') count++;
                    else if (board[newRow][newCol] === 'red') blocked++;
                    else break;
                } else {
                    blocked++;
                    break;
                }
            }
            
            // بررسی در جهت مخالف
            for (let i = 1; i <= 3; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                
                if (this.isValidPosition(board, newRow, newCol)) {
                    if (board[newRow][newCol] === 'yellow') count++;
                    else if (board[newRow][newCol] === 'red') blocked++;
                    else break;
                } else {
                    blocked++;
                    break;
                }
            }
            
            score += this.weights.adjacent * Math.pow(count, 2) * (1 - blocked / 2);
        }
        
        return score;
    }

    evaluatePotential(board, row, col) {
        let score = 0;
        
        // بررسی پتانسیل برد در آینده
        const tempBoard = board.map(row => [...row]);
        tempBoard[row][col] = 'yellow';
        
        // بررسی خطوط عمودی
        for (let c = 0; c < board[0].length; c++) {
            const potential = this.evaluateColumnPotential(tempBoard, c);
            score += potential;
        }
        
        // بررسی خطوط افقی و مورب
        score += this.evaluateLinesPotential(tempBoard, row, col);
        
        return score;
    }

    evaluateColumnPotential(board, col) {
        let score = 0;
        let emptySpaces = 0;
        let yellowCount = 0;
        let redCount = 0;
        
        for (let row = 0; row < board.length; row++) {
            if (board[row][col] === '') emptySpaces++;
            else if (board[row][col] === 'yellow') yellowCount++;
            else if (board[row][col] === 'red') redCount++;
        }
        
        if (yellowCount + emptySpaces >= 4) {
            score += this.weights.potential * Math.pow(yellowCount, 2);
        }
        
        if (redCount + emptySpaces >= 4) {
            score += this.weights.blocking * Math.pow(redCount, 2);
        }
        
        return score;
    }

    evaluateLinesPotential(board, row, col) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],  // افقی
            [[1, 0], [-1, 0]],  // عمودی
            [[1, 1], [-1, -1]], // مورب
            [[1, -1], [-1, 1]]  // مورب
        ];
        
        for (const [dir1, dir2] of directions) {
            let yellowCount = 1;
            let redCount = 0;
            let emptySpaces = 0;
            
            // بررسی در یک جهت
            for (let i = 1; i <= 3; i++) {
                const newRow = row + dir1[0] * i;
                const newCol = col + dir1[1] * i;
                
                if (this.isValidPosition(board, newRow, newCol)) {
                    if (board[newRow][newCol] === 'yellow') yellowCount++;
                    else if (board[newRow][newCol] === 'red') redCount++;
                    else if (board[newRow][newCol] === '') emptySpaces++;
                    else break;
                } else break;
            }
            
            // بررسی در جهت مخالف
            for (let i = 1; i <= 3; i++) {
                const newRow = row + dir2[0] * i;
                const newCol = col + dir2[1] * i;
                
                if (this.isValidPosition(board, newRow, newCol)) {
                    if (board[newRow][newCol] === 'yellow') yellowCount++;
                    else if (board[newRow][newCol] === 'red') redCount++;
                    else if (board[newRow][newCol] === '') emptySpaces++;
                    else break;
                } else break;
            }
            
            if (yellowCount + emptySpaces >= 4) {
                score += this.weights.potential * Math.pow(yellowCount, 2);
            }
            
            if (redCount + emptySpaces >= 4) {
                score += this.weights.blocking * Math.pow(redCount, 2);
            }
        }
        
        return score;
    }

    minimax(board, depth, isMaximizing, alpha, beta) {
        if (depth === 0) {
            return this.evaluateBoard(board);
        }
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const col of this.getValidMoves(board)) {
                const row = this.getLowestEmptyRow(board, col);
                if (row === -1) continue;
                
                board[row][col] = 'yellow';
                const score = this.minimax(board, depth - 1, false, alpha, beta);
                board[row][col] = '';
                
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const col of this.getValidMoves(board)) {
                const row = this.getLowestEmptyRow(board, col);
                if (row === -1) continue;
                
                board[row][col] = 'red';
                const score = this.minimax(board, depth - 1, true, alpha, beta);
                board[row][col] = '';
                
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }

    evaluateBoard(board) {
        let score = 0;
        
        // ارزیابی خطوط افقی
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[0].length - 3; col++) {
                score += this.evaluateWindow(board, row, col, 0, 1);
            }
        }
        
        // ارزیابی خطوط عمودی
        for (let row = 0; row < board.length - 3; row++) {
            for (let col = 0; col < board[0].length; col++) {
                score += this.evaluateWindow(board, row, col, 1, 0);
            }
        }
        
        // ارزیابی خطوط مورب مثبت
        for (let row = 0; row < board.length - 3; row++) {
            for (let col = 0; col < board[0].length - 3; col++) {
                score += this.evaluateWindow(board, row, col, 1, 1);
            }
        }
        
        // ارزیابی خطوط مورب منفی
        for (let row = 3; row < board.length; row++) {
            for (let col = 0; col < board[0].length - 3; col++) {
                score += this.evaluateWindow(board, row, col, -1, 1);
            }
        }
        
        return score;
    }

    evaluateWindow(board, row, col, rowDir, colDir) {
        let yellowCount = 0;
        let redCount = 0;
        let emptySpaces = 0;
        
        for (let i = 0; i < 4; i++) {
            const currentRow = row + rowDir * i;
            const currentCol = col + colDir * i;
            
            if (board[currentRow][currentCol] === 'yellow') yellowCount++;
            else if (board[currentRow][currentCol] === 'red') redCount++;
            else emptySpaces++;
        }
        
        let score = 0;
        
        if (yellowCount === 4) score += this.weights.winning;
        else if (yellowCount === 3 && emptySpaces === 1) score += this.weights.potential * 5;
        else if (yellowCount === 2 && emptySpaces === 2) score += this.weights.potential * 2;
        
        if (redCount === 4) score -= this.weights.winning;
        else if (redCount === 3 && emptySpaces === 1) score -= this.weights.blocking * 5;
        else if (redCount === 2 && emptySpaces === 2) score -= this.weights.blocking * 2;
        
        return score;
    }

    getValidMoves(board) {
        const moves = [];
        for (let col = 0; col < board[0].length; col++) {
            if (this.getLowestEmptyRow(board, col) !== -1) {
                moves.push(col);
            }
        }
        return moves;
    }

    getLowestEmptyRow(board, col) {
        for (let row = board.length - 1; row >= 0; row--) {
            if (board[row][col] === '') {
                return row;
            }
        }
        return -1;
    }

    isValidPosition(board, row, col) {
        return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
    }
}

// شروع بازی
const game = new Game(); 