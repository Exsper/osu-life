class Game {
    /**
     * 游戏主逻辑
     */
    constructor() {
        /** 游戏天数
         * @type {number}
         */
        this.day = 1;  // 从第1天开始

        /** 当前时间段: 'morning' | 'afternoon' | 'evening'
         * @type {"morning" | "afternoon" | "evening"}
         */
        this.timeSlot = 'morning';

        this.player = new Player(1);
        this.opponents = [];
        this.currentMatch = null;
        this.shop = new Shop();
        
        /** 比赛日数组
         * @type {number[]}
         */
        this.matchDays = [7, 13, 19, 25, 31];
        
        /** 游戏是否结束
         * @type {boolean}
         */
        this.gameOver = false;
        
        /** 游戏是否胜利
         * @type {boolean}
         */
        this.gameWin = false;
    }

    /**
     * 推进到下一个时间段
     */
    nextTimeSlot() {
        if (this.isMatchDay()) {
            // 比赛日直接跳过所有时间段
            this.day++;
            return;
        }
        
        switch (this.timeSlot) {
            case 'morning':
                this.timeSlot = 'afternoon';
                break;
            case 'afternoon':
                this.timeSlot = 'evening';
                break;
            case 'evening':
                this.timeSlot = 'morning';
                this.day++;
                break;
        }
    }

    /**
     * 检查是否是比赛日
     * @returns {boolean}
     */
    isMatchDay() {
        return this.matchDays.includes(this.day);
    }

    /**
     * 开始比赛
     */
    startMatch() {
        // 根据天数计算基础难度
        const baseStar = Math.floor(this.day / 6) + 3;
        this.currentMatch = new Match(this.day, baseStar);
    }

    /**
     * 进行玩家训练
     * @param {"aim" | "spd" | "acc" | "men" | "ez" | "hd"} type 训练类型
     */
    playerTrain(type) {
        if (!this.isMatchDay()) {
            return this.player.train(type);
        }
        return 0;
    }

    /**
     * 玩家工作
     */
    playerWork() {
        if (!this.isMatchDay()) {
            return this.player.goWork();
        }
        return 0;
    }

    /**
     * 玩家直播
     */
    playerWebcast() {
        if (!this.isMatchDay()) {
            return this.player.goWebcast();
        }
        return { moneyGain: 0 };
    }

    /**
     * 购买键盘升级
     */
    buyKeyboard() {
        const cost = this.shop.showKeyboardCost(this.player);
        if (cost !== -1 && this.player.money >= cost) {
            this.player.money -= cost;
            this.shop.buyKeyboard(this.player);
            return true;
        }
        return false;
    }

    /**
     * 购买显示器升级
     */
    buyMonitor() {
        const cost = this.shop.showMonitorCost(this.player);
        if (cost !== -1 && this.player.money >= cost) {
            this.player.money -= cost;
            this.shop.buyMonitor(this.player);
            return true;
        }
        return false;
    }

    /**
     * 购买主机升级
     */
    buyPc() {
        const cost = this.shop.showPcCost(this.player);
        if (cost !== -1 && this.player.money >= cost) {
            this.player.money -= cost;
            this.shop.buyPc(this.player);
            return true;
        }
        return false;
    }

    /**
     * 推进比赛流程
     */
    advanceMatch() {
        if (!this.currentMatch) return;
        
        this.currentMatch.nextStep();
        
        // 检查比赛是否结束
        if (this.currentMatch.ended) {
            if (this.currentMatch.playerWinRound > this.currentMatch.enemyWinRound) {
                // 玩家获胜
                if (this.day === 31) {
                    this.gameWin = true;
                    this.gameOver = true;
                }
            } else {
                // 玩家失败
                this.gameOver = true;
            }
        }
    }

    /**
     * 玩家在比赛中ban图
     * @param {number} bid 谱面ID
     */
    playerBan(bid) {
        if (this.currentMatch && this.currentMatch.currentStep === 'ban' && this.currentMatch.currentTurn === 'player') {
            return this.currentMatch.playerBanBeatmap(bid);
        }
        return false;
    }

    /**
     * 玩家在比赛中选图
     * @param {number} bid 谱面ID
     */
    playerPick(bid) {
        if (this.currentMatch && this.currentMatch.currentStep === 'pick' && this.currentMatch.currentTurn === 'player') {
            return this.currentMatch.playerPickBeatmap(bid);
        }
        return null;
    }

    /**
     * 玩家选择mods
     * @param {number} bid 谱面ID
     * @param {{"HR": boolean, "HD": boolean}} mods 
     */
    playerSelectMods(bid, mods) {
        if (this.currentMatch && this.currentMatch.currentStep === 'mods') {
            return this.currentMatch.playerSelectMods(bid, mods);
        }
        return null;
    }

    /**
     * 开始比赛回合
     */
    startRound() {
        if (this.currentMatch && this.currentMatch.currentStep === 'playing') {
            const currentMap = this.currentMatch.getAvailableBeatmaps().find(b => b.playing);
            if (!currentMap) return null;
            
            return this.currentMatch.startRound(
                this.player, 
                currentMap, 
                currentMap.playerMods, 
                currentMap.enemyMods
            );
        }
        return null;
    }
}