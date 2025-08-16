class Match {
    /**
     * 单局比赛
     * @param {number} id
     * @param {number} baseStar 谱面基础难度
     */
    constructor(id, baseStar) {
        /** 唯一索引
         * @type {number}
         */
        this.id = id;

        /** 谱面基础难度
         * @type {number}
         */
        this.baseStar = baseStar;

        /** 比赛难度参数，用于调整ban位和图池数量，整数
         * @type {number}
         */
        this.diffLevel = Math.floor((baseStar + 1) / 2.5);

        /** 比赛获胜局数
         * @type {number}
         */
        this.roundToWin = 4 + this.diffLevel;

        /** 当前局数
         * @type {number}
         */
        this.nowRound = 0;

        /** 当前游玩谱面
         * @type {Beatmap | null}
         */
        this.currentBeatmap = null;

        /** 当前轮到谁行动：'player' | 'enemy'
         * @type {"player" | "enemy"}
         */
        this.currentTurn = 'player';

        /** 当前环节：'roll' | 'ban' | 'pick' | 'mods' | 'playing'
         * @type {"roll" | "ban" | "pick" | "mods" | "playing"}
         */
        this.currentStep = 'roll';

        /** 玩家roll点
         * @type {number}
         */
        this.playerRoll = -1;

        /** 对手roll点
         * @type {number}
         */
        this.enemyRoll = -1;

        /** 比赛是否结束
         * @type {boolean}
         */
        this.ended = false;

        /** 玩家获胜局数
         * @type {number}
         */
        this.playerWinRound = 0;

        /** 对手获胜局数
         * @type {number}
         */
        this.enemyWinRound = 0;

        /** 比赛每位选手ban位
         * @type {number}
         */
        this.banSlots = 1 + Math.floor(this.diffLevel / 2);
        if (this.banSlots > 2) this.banSlots = 2;

        /** 玩家已用ban位
         * @type {number}
         */
        this.playerUsedBan = 0;

        /** 对手已用ban位
         * @type {number}
         */
        this.enemyUsedBan = 0;

        /** NM图池
         * @type {Array<Beatmap>}
         */
        this.pool_NM = [];

        /** HR图池
         * @type {Array<Beatmap>}
         */
        this.pool_HR = [];

        /** DT图池
         * @type {Array<Beatmap>}
         */
        this.pool_DT = [];

        /** HD图池
         * @type {Array<Beatmap>}
         */
        this.pool_HD = [];

        /** FM图池
         * @type {Array<Beatmap>}
         */
        this.pool_FM = [];

        /** EZ图池
         * @type {Array<Beatmap>}
         */
        this.pool_EZ = [];

        /** TB图池，应该只有一张
         * @type {Array<Beatmap>}
         */
        this.pool_TB = [];

        // 生成随机谱面
        this.genBeatmaps();

        // 生成对手
        this.enemy = new Player(this.id + 1);
        this.enemy.initEnemyStat(this.baseStar);

        // 赛点标志
        this.isTieBreak = false;

        // 上回合数据
        this.lastRoundData = null;
    }

    genBeatmaps() {
        let bid = 1;
        const counts = {
            NM: 3 + Math.ceil(this.diffLevel / 1.5),
            HR: 2 + Math.floor(this.diffLevel / 2),
            DT: 2 + Math.floor(this.diffLevel / 2),
            HD: 2 + Math.round(this.diffLevel / 2),
            FM: 1 + Math.ceil(this.diffLevel / 1.5),
            EZ: 1 + Math.floor(this.diffLevel / 2),
            TB: 1
        };

        for (const [type, count] of Object.entries(counts)) {
            for (let i = 0; i < count; i++) {
                const b = new Beatmap(bid++);
                b.init(this.baseStar, type);
                this[`pool_${type}`].push(b);
            }
        }
    }

    /**
     * 获取所有目前可选的谱面（包括目前游戏中的谱面）
     * @param {boolean} includeTB 包含TB，不允许玩家和对手主动ban/pick TB
     * @returns {Array<Beatmap>}
     */
    getAvailableBeatmaps(includeTB = true) {
        const allPools = (includeTB) ? [
            ...this.pool_NM,
            ...this.pool_HR,
            ...this.pool_DT,
            ...this.pool_HD,
            ...this.pool_FM,
            ...this.pool_EZ,
            ...this.pool_TB
        ] : [
            ...this.pool_NM,
            ...this.pool_HR,
            ...this.pool_DT,
            ...this.pool_HD,
            ...this.pool_FM,
            ...this.pool_EZ
        ];
        return allPools.filter(b => !b.banned && !b.picked);
    }

    /**
     * 获取所有谱面
     * @returns {Array<Beatmap>}
     */
    getAllBeatmaps() {
        const allPools = [
            ...this.pool_NM,
            ...this.pool_HR,
            ...this.pool_DT,
            ...this.pool_HD,
            ...this.pool_FM,
            ...this.pool_EZ,
            ...this.pool_TB
        ];
        return allPools;
    }

    /**
     * 玩家ban图
     * @param {number} bid 谱面id
     */
    playerBanBeatmap(bid) {
        if (this.playerUsedBan >= this.banSlots) throw "漏判玩家ban位";

        const beatmap = this.getAvailableBeatmaps(false).find(b => b.id === bid);
        if (!beatmap) throw "找不到指定谱面或谱面不可用";

        beatmap.banned = true;
        beatmap.bannedBy = 'player';
        this.playerUsedBan++;
        // 如果双方都ban完，进入pick阶段
        if (this.playerUsedBan >= this.banSlots && this.enemyUsedBan >= this.banSlots) {
            this.currentStep = 'pick';
            // 后ban的先选，所以如果是玩家最后ban，玩家应该先选
            this.currentTurn = 'player';
        } else {
            // 否则轮到对手ban图
            this.currentTurn = 'enemy';
        }
        return true;
    }

    /**
     * 对手ban图，根据自身属性进行简单判断
     */
    enemyBanBeatmap() {
        if (this.enemyUsedBan >= this.banSlots) throw "漏判对手ban位";

        // 对手AI: ban掉自己最不擅长的图池中的谱面
        const available = this.getAvailableBeatmaps(false);
        if (available.length <= 0) throw "找不到可用谱面";

        // 计算各图池的难度评分
        const poolScores = {
            HR: this.enemy.aim,
            DT: this.enemy.spd,
            EZ: (this.enemy.acc + this.enemy.prf_EZ * 3) / 4,
            HD: (this.enemy.aim + this.enemy.spd + this.enemy.acc + this.enemy.prf_HD * 9) / 12,
            NM: (this.enemy.aim + this.enemy.spd + this.enemy.acc) / 3,
            FM: (this.enemy.aim + this.enemy.spd + this.enemy.acc + this.enemy.prf_EZ * 3 + this.enemy.prf_HD * 3) / 9,
            // TB: this.enemy.men  // 不允许ban TB
        };

        // 找到对手最不擅长的图池
        let weakestPool = 'NM';
        let minScore = Infinity;
        for (const [pool, score] of Object.entries(poolScores)) {
            if (score < minScore) {
                minScore = score;
                weakestPool = pool;
            }
        }

        // 在该图池中随机ban一张图
        const weakBeatmaps = this[`pool_${weakestPool}`].filter(b => !b.banned && !b.picked);
        if (weakBeatmaps.length > 0) {
            const randomIndex = Math.floor(Math.random() * weakBeatmaps.length);
            weakBeatmaps[randomIndex].banned = true;
            weakBeatmaps[randomIndex].bannedBy = 'enemy';
        } else {
            // 如果目标图池没有可用谱面，随机ban一张
            const randomIndex = Math.floor(Math.random() * available.length);
            available[randomIndex].banned = true;
            available[randomIndex].bannedBy = 'enemy';
        }

        this.enemyUsedBan++;

        // 如果双方都ban完，进入pick阶段
        if (this.playerUsedBan >= this.banSlots && this.enemyUsedBan >= this.banSlots) {
            this.currentStep = 'pick';
            // 后ban的先选，所以如果是对手最后ban，对手应该先选
            this.currentTurn = 'enemy';
        } else {
            // 否则轮到玩家ban图
            this.currentTurn = 'player';
        }
        return true;
    }

    /**
     * 玩家选图
     * @param {number} bid 谱面id
     */
    playerPickBeatmap(bid) {
        const beatmap = this.getAvailableBeatmaps(false).find(b => b.id === bid);
        if (!beatmap) throw "找不到可用谱面";

        beatmap.picked = true;
        beatmap.pickedBy = 'player';
        beatmap.playing = true;
        this.currentBeatmap = beatmap;
        this.currentStep = 'mods'; // 玩家选图后，双方同时选择mods（对手应立刻给出mods以便玩家参考），玩家点击“开始”后进行比赛
        // this.currentTurn = 'enemy'; // 确保下一步轮到对手
        return beatmap;
    }

    /**
     * 对手选图，根据自身属性进行简单判断
     */
    enemyPickBeatmap() {
        const available = this.getAvailableBeatmaps(false);
        if (available.length <= 0) throw "找不到可用谱面";

        // 对手AI: 选择自己最擅长的图池中的谱面
        const poolScores = {
            HR: this.enemy.aim,
            DT: this.enemy.spd,
            EZ: (this.enemy.acc + this.enemy.prf_EZ * 3) / 4,
            HD: (this.enemy.aim + this.enemy.spd + this.enemy.acc + this.enemy.prf_HD * 9) / 12,
            NM: (this.enemy.aim + this.enemy.spd + this.enemy.acc) / 3,
            FM: (this.enemy.aim + this.enemy.spd + this.enemy.acc + this.enemy.prf_EZ * 3 + this.enemy.prf_HD * 3) / 9,
            // TB: this.enemy.men
        };

        // 找到对手最擅长的图池
        let strongestPool = 'NM';
        let maxScore = -Infinity;
        for (const [pool, score] of Object.entries(poolScores)) {
            if (score > maxScore) {
                maxScore = score;
                strongestPool = pool;
            }
        }

        // 在该图池中随机选一张图
        let strongBeatmaps = this[`pool_${strongestPool}`].filter(b => !b.banned && !b.picked);
        if (strongBeatmaps.length <= 0) {
            strongBeatmaps = available;
        }

        const randomIndex = Math.floor(Math.random() * strongBeatmaps.length);
        const beatmap = strongBeatmaps[randomIndex];
        beatmap.picked = true;
        beatmap.pickedBy = 'enemy'
        beatmap.playing = true;
        this.currentBeatmap = beatmap;
        this.currentStep = 'mods'  // 对手选图后，双方同时选择mods（对手应立刻给出mods以便玩家参考），玩家点击“开始”后进行比赛
        // this.currentTurn = 'player'; // 确保下一步轮到玩家
        return beatmap;
    }

    /**
     * 玩家选择Mods
     * @param {number} bid 谱面id
     * @param {{"HR": boolean, "HD": boolean}} mods 在图池强制mod之外选择的mod，只有FM和TB图池才可以自由选择mods
     */
    playerSelectMods(bid, mods) {
        const beatmap = this.currentBeatmap;
        if (!beatmap || bid !== this.currentBeatmap.id || !beatmap.playing) throw "谱面出错";

        // 根据图池类型处理强制mod
        const finalMods = { HR: mods.HR, DT: false, HD: mods.HD, EZ: false };

        switch (beatmap.poolType) {
            case 'HR':
                finalMods.HR = true;
                break;
            case 'DT':
                finalMods.DT = true;
                break;
            case 'EZ':
                finalMods.EZ = true;
                break;
            case 'HD':
                finalMods.HD = true;
                break;
            case 'FM':
            case 'TB':
                // 允许自由选择HR和HD
                finalMods.HR = mods.HR || false;
                finalMods.HD = mods.HD || false;
                break;
        }

        // 设置当前谱面的mods
        beatmap.playerMods = finalMods;

        // 推进
        this.currentStep = 'playing';

        return finalMods;
    }

    /**
     * 对手选择Mods，根据自身属性进行简单判断
     * 应该在playerPickBeatmap()或enemyPickBeatmap()后立刻执行，给出mods以便玩家参考做出对应决策
     * @param {number} bid 谱面id
     */
    enemySelectMods(bid) {
        const beatmap = this.currentBeatmap;
        if (!beatmap || bid !== this.currentBeatmap.id || !beatmap.playing) throw "谱面出错";

        // 根据图池类型处理强制mod
        const finalMods = { HR: false, DT: false, HD: false, EZ: false };

        switch (beatmap.poolType) {
            case 'HR':
                finalMods.HR = true;
                if (this.enemy.prf_HD > 1.5) {
                    finalMods.HD = true; // 如果HD熟练度高，选择HD
                }
                break;
            case 'DT':
                finalMods.DT = true;
                if (this.enemy.prf_HD > 1.5) {
                    finalMods.HD = true; // 如果HD熟练度高，选择HD
                }
                break;
            case 'EZ':
                finalMods.EZ = true;
                break;
            case 'HD':
                finalMods.HD = true;
                break;
            case 'FM':
            case 'TB':
                if (this.enemy.aim > (beatmap.basic_aim_rating * 1.5)) {
                    finalMods.HR = true; // 如果aim高，选择HR
                }
                if (this.enemy.prf_HD > 1.5) {
                    finalMods.HD = true; // 如果HD熟练度高，选择HD
                }
                break;
        }

        // 设置当前谱面的mods
        beatmap.enemyMods = finalMods;

        return finalMods;
    }

    /**
     * 开始比赛中的一个回合
     * @param {Player} player 玩家
     * @param {Beatmap} beatmap 谱面
     * @param {{"HR": boolean, "DT": boolean, "HD": boolean, "EZ": boolean}} playerSelectedMods 玩家最终选择的mod，包含图池强制的mod
     * @param {{"HR": boolean, "DT": boolean, "HD": boolean, "EZ": boolean}} enemySelectedMods 对手最终选择的mod，包含图池强制的mod
     */
    startRound(player, beatmap, playerSelectedMods, enemySelectedMods) {
        if (!beatmap || !beatmap.playing) throw "谱面出错";

        let playerScore = beatmap.getSimScore(player, playerSelectedMods);
        let enemyScore = beatmap.getSimScore(this.enemy, enemySelectedMods);

        // 确定本回合胜者
        let roundWinner = null;
        if (playerScore > enemyScore) {
            this.playerWinRound++;
            roundWinner = 'player';
        } else if (enemyScore > playerScore) {
            this.enemyWinRound++;
            roundWinner = 'enemy';
        } else {
            // 平局处理：随机选择胜者
            roundWinner = Math.random() > 0.5 ? 'player' : 'enemy';
            if (roundWinner === 'player') this.playerWinRound++;
            else this.enemyWinRound++;
        }

        this.nowRound++;
        beatmap.playing = false;

        // 检查是否进入赛点（双方都差一分获胜）
        if (this.playerWinRound === this.roundToWin - 1 &&
            this.enemyWinRound === this.roundToWin - 1) {
            this.isTieBreak = true;
        }

        // 检查比赛是否结束
        if (this.playerWinRound >= this.roundToWin || this.enemyWinRound >= this.roundToWin) {
            this.ended = true;
            return {
                playerScore,
                enemyScore,
                roundWinner,
                playerWinRound: this.playerWinRound,
                enemyWinRound: this.enemyWinRound,
                ended: this.ended
            };
        }

        // 准备下一回合
        this.currentStep = "pick";
        // 切换选图顺序
        if (this.currentTurn === "enemy") this.currentTurn = "player";
        else this.currentTurn = "enemy";

        return {
            playerScore,
            enemyScore,
            roundWinner,
            playerWinRound: this.playerWinRound,
            enemyWinRound: this.enemyWinRound,
            ended: this.ended
        };
    }

    nextStep(player) {
        if (this.currentStep === 'roll') {
            // roll点确定先ban还是后ban
            this.playerRoll = Math.floor(Math.random() * 100) + 1;
            this.enemyRoll = Math.floor(Math.random() * 100) + 1;

            if (this.playerRoll > this.enemyRoll) {
                // 玩家点数大，先ban后pick
                this.currentTurn = 'player';
            } else {
                // 对手点数大，先ban后pick
                this.currentTurn = 'enemy';
            }

            this.currentStep = 'ban';
            return;
        }

        if (this.currentStep === 'ban') {
            if (this.currentTurn === "player") {
                // 等待玩家ban图（通过UI操作）
                return;
            } else {
                // 对手自动ban图
                this.enemyBanBeatmap();
                return;
            }
        }

        if (this.currentStep === 'pick') {
            // 检查是否进入赛点（强制TB）
            if (this.isTieBreak) {
                // 强制选择TB图
                const tbMap = this.pool_TB.find(b => !b.banned && !b.picked);
                if (tbMap) {
                    tbMap.picked = true;
                    tbMap.playing = true;
                    this.currentStep = 'mods';
                }
                return;
            }

            if (this.currentTurn === "player") {
                // 等待玩家pick图（通过UI操作）
                return;
            } else {
                // 对手自动pick图
                this.enemyPickBeatmap();
                return;
            }
        }

        if (this.currentStep === 'mods') {
            const currentMap = this.currentBeatmap;
            if (!currentMap) throw "当前谱面出错";

            // 对手自动选择mods
            this.enemySelectMods(currentMap.id);

            // 等待玩家选择mods（通过UI操作）
            return;
        }

        if (this.currentStep === 'playing') {
            const currentMap = this.currentBeatmap;
            if (!currentMap) throw "当前谱面出错";

            // 获取玩家和对手的mods选择
            const playerMods = currentMap.playerMods ||
                this.playerSelectMods(currentMap.id, { HR: false, HD: false });
            const enemyMods = currentMap.enemyMods ||
                this.enemySelectMods(currentMap.id);

            // 开始比赛回合
            this.lastRoundData = this.startRound(player, currentMap, playerMods, enemyMods);
            return;
        }
    }
}