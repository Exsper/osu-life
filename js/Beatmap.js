class Beatmap {
    /**
     * 比赛谱面
     * @param {number} id
     */
    constructor(id) {
        /** 唯一索引
         * @type {number}
         */
        this.id = id;

        /** 反映谱面CircleSize(CS)，为了便于与玩家aim（精度）比较，转换为难度评价，mod加成前
         * @type {number}
         */
        this.basic_aim_rating = 1;

        /** 反映谱面BPM，为了便于与玩家spd（速度）比较，转换为难度评价
         * @type {number}
         */
        this.basic_spd_rating = 1;

        /** 反映谱面OverallDifficulty(OD，在osu!中影响Good判定范围)，为了便于与玩家acc（准度）比较，转换为难度评价
         * @type {number}
         */
        this.basic_acc_rating = 1;

        /** 反映谱面max combo，为了便于与玩家men（心态）比较，转换为难度评价，>=1
         * @type {number}
         */
        this.maxcombo_rating = 1;

        /** 每个bonus=200分，加入随机bonus，防止双方都是满分
         * @type {number}
         */
        this.bonusScoreCounts = 10;

        /** 该谱面已被选手ban掉
         * @type {boolean}
         */
        this.banned = false;

        /** 该谱面已被选手pick
         * @type {boolean}
         */
        this.picked = false;

        /** 该谱面正在比赛中游玩
         * @type {boolean}
         */
        this.playing = false;

        /** 该谱面理论满分，mod加成前
         * @type {number}
         */
        this.basic_maxScore = 1_000_000;

        /**
         * 该谱面所在图池类型，有些图池需要强制开启mod
         * NM - 强制No mod，对谱面无特殊要求 score *= 1 \
         * HR - 玩家自主选择是否开启HD，该谱面aim_rating *= 1.4, acc_rating *= 1.2, score *= 1.06 \
         * DT - 玩家自主选择是否开启HD，该谱面spd_rating *= 1.5, score *= 1.12 \
         * HD - 对谱面无特殊要求 score *= 1.06 \
         * FM - 玩家自主选择NM(No mod, score *1)或HR(*1.06)或HD(*1.06)或HDHR(*1.12)，影响难度和满分 \
         * EZ - 玩家自主选择是否开启HD，该谱面aim_rating *= 0.5, acc_rating *= 1.5，score *= 0.5, 只有某些特定规则的比赛会有此模式的图池 \
         * TB - 综合要求高，可以自主选择NM(No mod, score *1)或HR(*1.06)或HD(*1.06)或HDHR(*1.12)，不可被ban
         * @type {"NM" | "HR" | "DT" | "HD" | "FM" | "EZ" | "TB"}
         */
        this.poolType = "NM";

        /** 玩家开启mods
         */
        this.playerMods = { HR: false, DT: false, HD: false, EZ: false };

        /** 对手开启mods
         */
        this.enemyMods = { HR: false, DT: false, HD: false, EZ: false };

        /** 该谱面被谁ban了（如果被ban）
         * @type {"player" | "enemy" | null}
         */
        this.bannedBy = null;

        /** 该谱面被谁pick了（如果被pick）
         * @type {"player" | "enemy" | null}
         */
        this.pickedBy = null;
    }

    /**
     * 设置mod加成后的属性，用于实时显示给用户看
     * @param {{"HR": boolean, "DT": boolean, "HD": boolean, "EZ": boolean}} mods 这里的mod是玩家最终选择的mod，包含图池强制的mod
     */
    getRatingsWithMods(mods) {
        let aim_rating = this.basic_aim_rating;
        let spd_rating = this.basic_spd_rating;
        let acc_rating = this.basic_acc_rating;
        let maxScore = this.basic_maxScore;
        if (mods.EZ === true && mods.HR === true) {
            throw "不能同时开启EZ和HR";
        }
        if (mods.HR) {
            aim_rating *= 1.4;
            acc_rating *= 1.2;
            maxScore *= 1.06;
        }
        if (mods.DT) {
            spd_rating *= 1.5;
            maxScore *= 1.12;
        }
        if (mods.HD) {
            maxScore *= 1.06;
        }
        if (mods.EZ) {
            aim_rating *= 0.5;
            acc_rating *= 1.5;
            maxScore *= 0.5;
        }
        return {
            aim_rating, spd_rating, acc_rating, maxScore
        }
    }

    /**
     * 设置数值
     * @param {number} baseStar 基础难度
     * @param {"NM" | "HR" | "DT" | "HD" | "FM" | "EZ" | "TB"} poolType 图池类型
     */
    init(baseStar, poolType) {
        this.poolType = poolType;
        // 各属性在[-2, +2]浮动
        this.basic_aim_rating = baseStar + Math.random() * 4 - 2;
        if (this.basic_aim_rating < 0) this.basic_aim_rating = 0;
        this.basic_spd_rating = baseStar + Math.random() * 4 - 2;
        if (this.basic_spd_rating < 0) this.basic_spd_rating = 0;
        this.basic_acc_rating = baseStar + Math.random() * 4 - 2;
        if (this.basic_acc_rating < 0) this.basic_acc_rating = 0;
        this.maxcombo_rating = baseStar + Math.random() * 4 - 2;
        if (this.maxcombo_rating <= 1) this.maxcombo_rating = 1;

        if (poolType === "NM") {
            // 难度稍微提升一点
            this.basic_aim_rating = baseStar + Math.random();
            this.basic_spd_rating = baseStar + Math.random();
            this.basic_acc_rating = baseStar + Math.random();
            this.maxcombo_rating = baseStar + Math.random();
        }
        /* 因为mods会改变难度，所以谱面原始难度不做要求
        else if (poolType === "HD") { }
        else if (poolType === "EZ") { }
        else if (poolType === "FM") { }
        else if (poolType === "HR") {
            // 确保aim_rating最大
            if (this.basic_aim_rating !== Math.max(this.basic_aim_rating, this.basic_spd_rating, this.basic_acc_rating)) {
                this.basic_aim_rating = Math.max(this.basic_aim_rating, this.basic_spd_rating, this.basic_acc_rating) + Math.random() * 2;
            }
        }
        else if (poolType === "DT") {
            // 确保spd_rating最大
            if (this.basic_spd_rating !== Math.max(this.basic_aim_rating, this.basic_spd_rating, this.basic_acc_rating)) {
                this.basic_spd_rating = Math.max(this.basic_aim_rating, this.basic_spd_rating, this.basic_acc_rating) + Math.random() * 2;
            }
        }
        */
        if (poolType === "TB") {
            // 难度均衡且较高，Combo要很高
            this.basic_aim_rating = baseStar + Math.random() * 2;
            this.basic_spd_rating = baseStar + Math.random() * 2;
            this.basic_acc_rating = baseStar + Math.random() * 2;
            this.maxcombo_rating = baseStar + Math.random() * 2 + 3;
        }
    }




    /**
     * 模拟比赛出分
     * @param {Player} player 玩家
     * @param {{"HR": boolean, "DT": boolean, "HD": boolean, "EZ": boolean}} mods 这里的mod是玩家最终选择的mod，包含图池强制的mod
     */
    getSimScore(player, mods) {
        /**
         * 测算每个维度的独立评分
         * @param {number} attr 玩家属性
         * @param {number} rating 谱面属性
         * @returns {number} 评分，范围[0,1]
         */
        function calc_individual_score(attr, rating) {
            if (rating <= 0) // 该维度无难度要求
                return 1.0;
            const ratio = attr / rating;
            if (ratio >= 1.0) {
                // 属性达标
                // 线性映射：1.0~1.25 → 80%~100%
                const upper_bound = 1.25;
                const progress = Math.min((ratio - 1.0) / (upper_bound - 1.0), 1.0);
                return 0.8 + 0.2 * progress;
            }
            else {
                // 属性未达标
                // 快速衰减：二次方衰减
                return 0.8 * (ratio ** 2);
            }
        }

        // 属性调整
        let adj_factor = 1.0;
        // 心态影响：按比例降低属性值
        if (player.men < this.maxcombo_rating && this.maxcombo_rating > 0) {
            adj_factor = Math.max(0, player.men / this.maxcombo_rating);
        }
        // 熟练度影响，这里只看EZ和HD，因为这两个mod改变了游戏玩法，需要单独引入熟练度
        if (mods.EZ) adj_factor *= 1.1 ** player.prf_EZ;
        if (mods.HD) adj_factor *= 1.1 ** player.prf_HD;

        // 疲劳度影响
        let fatigueFactor = 1 - (player.fatigue / 300);
        if (fatigueFactor < 0.01) fatigueFactor = 0.01;
        adj_factor *= fatigueFactor;

        // 计算谱面属性
        let ratings = this.getRatingsWithMods(mods);
        let aim_rating = ratings.aim_rating;
        let spd_rating = ratings.spd_rating;
        let acc_rating = ratings.acc_rating;
        let maxScore = ratings.maxScore;

        // 玩家应用属性调整
        let aim_adj = player.aim * adj_factor;
        let spd_adj = player.spd * adj_factor;
        let acc_adj = player.acc * adj_factor;

        // 计算各维度评分
        let aim_score = calc_individual_score(aim_adj, aim_rating);
        let spd_score = calc_individual_score(spd_adj, spd_rating);
        let acc_score = calc_individual_score(acc_adj, acc_rating);

        // 水桶效应：最低维度权重最高
        // 升序排序三个评分
        const sorted = [aim_score, spd_score, acc_score].sort((a, b) => a - b);
        // 解构赋值获取三个值
        const [min, mid, max] = sorted;
        // 按权重计算并求和，算出模拟成绩
        let totalScore = (min * 0.5 + mid * 0.3 + max * 0.2) * maxScore;
        // bonus
        let bonusScore = 200 * Math.floor(Math.random() * (this.bonusScoreCounts + 1));
        bonusScore *= (maxScore / this.basic_maxScore);
        return totalScore + bonusScore;
    }

    getInnerHTML() {
        let mods = { HR: false, DT: false, HD: false, EZ: false };
        switch (this.poolType) {
            case "DT": { mods.DT = true; break; }
            case "HR": { mods.HR = true; break; }
            case "HD": { mods.HD = true; break; }
            case "EZ": { mods.EZ = true; break; }
        }
        let ratings = this.getRatingsWithMods(mods);
        let aim_rating = ratings.aim_rating;
        let spd_rating = ratings.spd_rating;
        let acc_rating = ratings.acc_rating;
        return `<div class="beatmap-type">${this.poolType}</div>
                <div class="beatmap-name">谱面 #${this.id}</div>
                <div class="beatmap-stats">
                    <div>CS: ${aim_rating.toFixed(2)} ★</div>
                    <div>BPM: ${spd_rating.toFixed(2)} ★</div>
                    <div>OD: ${acc_rating.toFixed(2)} ★</div>
                    <div>Combo: ${this.maxcombo_rating.toFixed(2)} ★</div>
                </div>
            `;
    }
}
