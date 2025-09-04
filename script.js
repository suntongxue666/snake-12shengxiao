document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const difficultySelect = document.getElementById('difficulty');
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    // 设置画布大小
    canvas.width = 600;
    canvas.height = 400;
    
    // 游戏变量
    let snake = [];
    let food = {};
    let obstacles = [];
    let direction = 'right';
    let nextDirection = 'right';
    let gameInterval;
    let gameSpeed = 150;
    let score = 0;
    let gameRunning = false;
    let gamePaused = false;
    let gridSize = 20;
    let difficultyLevel = 'medium';
    let zodiacCounts = {};
    
    // 十二生肖图标（使用emoji代替，实际项目中可以使用图片）
    const zodiacEmojis = {
        dragon: '🐉', // 龙 - 蛇头
        rat: '🐀',    // 鼠
        ox: '🐂',     // 牛
        tiger: '🐅',  // 虎
        rabbit: '🐇', // 兔
        snake: '🐍',  // 蛇
        horse: '🐎',  // 马
        goat: '🐐',   // 羊
        monkey: '🐒', // 猴
        rooster: '🐓', // 鸡
        dog: '🐕',    // 狗
        pig: '🐖'     // 猪
    };
    
    // 中国风障碍物（使用emoji代替，实际项目中可以使用图片）
    const obstacleTypes = ['🏯', '🏮', '🌸', '⛩️', '🎎'];
    
    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        snake = [
            {x: 5 * gridSize, y: 10 * gridSize},
            {x: 4 * gridSize, y: 10 * gridSize},
            {x: 3 * gridSize, y: 10 * gridSize}
        ];
        
        score = 0;
        scoreElement.textContent = score;
        direction = 'right';
        nextDirection = 'right';
        
        // 重置生肖计数
        zodiacCounts = {};
        updateZodiacCounter();
        
        // 根据难度设置障碍物
        setDifficulty(difficultySelect.value);
        
        // 生成食物
        generateFood();
        
        // 更新游戏速度
        updateGameSpeed();
    }
    
    // 设置游戏难度
    function setDifficulty(level) {
        difficultyLevel = level;
        obstacles = [];
        
        // 根据难度生成不同数量和位置的障碍物
        let obstacleCount = 0;
        
        switch(level) {
            case 'easy':
                obstacleCount = 3;
                break;
            case 'medium':
                obstacleCount = 8;
                break;
            case 'hard':
                obstacleCount = 15;
                break;
        }
        
        // 生成障碍物
        for (let i = 0; i < obstacleCount; i++) {
            generateObstacle();
        }
    }
    
    // 生成障碍物
    function generateObstacle() {
        let obstacle;
        let validPosition = false;
        
        while (!validPosition) {
            obstacle = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
                type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]
            };
            
            // 确保障碍物不会生成在蛇身上
            validPosition = !snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y);
            
            // 确保障碍物不会生成在其他障碍物上
            if (validPosition) {
                validPosition = !obstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y);
            }
            
            // 确保障碍物不会生成在食物上
            if (validPosition && food.x === obstacle.x && food.y === obstacle.y) {
                validPosition = false;
            }
            
            // 确保障碍物不会生成在蛇头周围的区域，给玩家一些空间
            if (validPosition) {
                const headX = snake[0].x;
                const headY = snake[0].y;
                const safeDistance = 3 * gridSize;
                
                if (Math.abs(obstacle.x - headX) < safeDistance && Math.abs(obstacle.y - headY) < safeDistance) {
                    validPosition = false;
                }
            }
        }
        
        obstacles.push(obstacle);
    }
    
    // 获取随机生肖（除了龙）
    function getRandomZodiac() {
        const zodiacKeys = Object.keys(zodiacEmojis).filter(key => key !== 'dragon');
        const randomKey = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
        return {
            type: randomKey,
            emoji: zodiacEmojis[randomKey]
        };
    }
    
    // 生成食物
    function generateFood() {
        let validPosition = false;
        const zodiacInfo = getRandomZodiac();
        
        while (!validPosition) {
            food = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
                type: zodiacInfo.type,
                emoji: zodiacInfo.emoji
            };
            
            // 确保食物不会生成在蛇身上
            validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
            
            // 确保食物不会生成在障碍物上
            if (validPosition) {
                validPosition = !obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y);
            }
        }
    }
    
    // 更新游戏速度
    function updateGameSpeed() {
        const speedValue = parseInt(speedSlider.value);
        // 速度值越大，间隔越小，游戏越快
        gameSpeed = 200 - (speedValue * 15);
        
        // 如果游戏正在运行，重新设置间隔
        if (gameRunning && !gamePaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }
    
    // 游戏主循环
    function gameLoop() {
        if (gamePaused) return;
        
        // 更新方向
        direction = nextDirection;
        
        // 移动蛇
        moveSnake();
        
        // 检查碰撞
        if (checkCollision()) {
            endGame();
            return;
        }
        
        // 检查是否吃到食物
        checkFood();
        
        // 绘制游戏
        drawGame();
    }
    
    // 移动蛇
    function moveSnake() {
        // 获取蛇头位置
        const head = {x: snake[0].x, y: snake[0].y};
        
        // 根据方向移动蛇头
        switch(direction) {
            case 'up':
                head.y -= gridSize;
                break;
            case 'down':
                head.y += gridSize;
                break;
            case 'left':
                head.x -= gridSize;
                break;
            case 'right':
                head.x += gridSize;
                break;
        }
        
        // 处理穿墙
        if (head.x >= canvas.width) head.x = 0;
        if (head.x < 0) head.x = canvas.width - gridSize;
        if (head.y >= canvas.height) head.y = 0;
        if (head.y < 0) head.y = canvas.height - gridSize;
        
        // 将新头部添加到蛇身体前面
        snake.unshift(head);
        
        // 如果没有吃到食物，移除尾部；否则保留尾部，蛇会变长
        if (head.x !== food.x || head.y !== food.y) {
            snake.pop();
        }
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞到自己
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        // 检查是否撞到障碍物
        for (let obstacle of obstacles) {
            if (head.x === obstacle.x && head.y === obstacle.y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否吃到食物
    function checkFood() {
        const head = snake[0];
        
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 记录吃到的生肖
            if (!zodiacCounts[food.type]) {
                zodiacCounts[food.type] = {
                    emoji: food.emoji,
                    count: 1
                };
            } else {
                zodiacCounts[food.type].count++;
            }
            
            // 更新生肖计数显示
            updateZodiacCounter();
            
            // 生成新食物
            generateFood();
            
            // 每吃到3个食物，增加一个障碍物（如果不是简单难度）
            if (difficultyLevel !== 'easy' && score % 30 === 0) {
                generateObstacle();
            }
        }
    }
    
    // 更新生肖计数显示
    function updateZodiacCounter() {
        const counterElement = document.getElementById('zodiac-counter');
        counterElement.innerHTML = '';
        
        for (const [type, data] of Object.entries(zodiacCounts)) {
            const zodiacItem = document.createElement('div');
            zodiacItem.className = 'zodiac-item';
            
            const zodiacEmoji = document.createElement('span');
            zodiacEmoji.className = 'zodiac-emoji';
            zodiacEmoji.textContent = data.emoji;
            
            const zodiacCount = document.createElement('span');
            zodiacCount.className = 'zodiac-count';
            zodiacCount.textContent = data.count;
            
            zodiacItem.appendChild(zodiacEmoji);
            zodiacItem.appendChild(zodiacCount);
            counterElement.appendChild(zodiacItem);
        }
    }
    
    // 绘制游戏
    function drawGame() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            
            // 蛇头使用龙的emoji，身体使用不同颜色的方块
            if (i === 0) {
                ctx.font = `${gridSize}px Arial`;
                ctx.fillText(zodiacEmojis.dragon, segment.x, segment.y + gridSize);
            } else {
                ctx.fillStyle = i % 2 === 0 ? '#d4a017' : '#8b0000';
                ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
                
                // 添加中国风纹理
                ctx.strokeStyle = '#fff5e1';
                ctx.lineWidth = 1;
                ctx.strokeRect(segment.x + 2, segment.y + 2, gridSize - 4, gridSize - 4);
            }
        }
        
        // 绘制食物
        ctx.font = `${gridSize}px Arial`;
        ctx.fillText(food.emoji, food.x, food.y + gridSize);
        
        // 绘制障碍物
        for (let obstacle of obstacles) {
            ctx.font = `${gridSize}px Arial`;
            ctx.fillText(obstacle.type, obstacle.x, obstacle.y + gridSize);
        }
    }
    
    // 开始游戏
    function startGame() {
        if (!gameRunning) {
            initGame();
            gameRunning = true;
            gamePaused = false;
            gameInterval = setInterval(gameLoop, gameSpeed);
            startBtn.textContent = '重新开始';
            pauseBtn.disabled = false;
        } else {
            // 如果游戏已经在运行，重新开始
            clearInterval(gameInterval);
            initGame();
            gamePaused = false;
            gameInterval = setInterval(gameLoop, gameSpeed);
            pauseBtn.textContent = '暂停';
        }
    }
    
    // 暂停/继续游戏
    function togglePause() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            pauseBtn.textContent = '继续';
        } else {
            pauseBtn.textContent = '暂停';
            // 继续游戏循环
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }
    
    // 结束游戏
    function endGame() {
        clearInterval(gameInterval);
        gameRunning = false;
        
        // 显示游戏结束信息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Ma Shan Zheng';
        ctx.fillStyle = '#d4a017';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '24px Ma Shan Zheng';
        ctx.fillText(`最终分数: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.font = '18px Ma Shan Zheng';
        ctx.fillText('点击"开始游戏"重新开始', canvas.width / 2, canvas.height / 2 + 50);
        
        startBtn.textContent = '重新开始';
        pauseBtn.disabled = true;
    }
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        
        // 防止蛇立即向相反方向移动
        switch(e.key.toLowerCase()) {
            case 'w':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 's':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'a':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'd':
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    });
    
    // 事件监听器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    pauseBtn.disabled = true;
    
    difficultySelect.addEventListener('change', () => {
        if (gameRunning) {
            clearInterval(gameInterval);
            initGame();
            gameInterval = setInterval(gameLoop, gameSpeed);
        } else {
            initGame();
            drawGame();
        }
    });
    
    speedSlider.addEventListener('input', () => {
        speedValue.textContent = speedSlider.value;
        updateGameSpeed();
    });
    
    // 初始绘制游戏界面
    initGame();
    drawGame();
});