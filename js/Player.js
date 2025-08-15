class Player {
    /**
     * 玩家或电脑玩家
     * @param {number} id
     */
    constructor(id) {
        /** 唯一索引
         * @type {number}
         */
        this.id = id;

        /** 金钱
         * @type {number}
         */
        this.money = 0;

        /** 工作次数，工作次数越多获得金钱越多
         * @type {number}
         */
        this.workCount = 0;

        /** 玩家aim（精度）属性
         * @type {number}
         */
        this.aim = 1;

        /** 玩家aim训练次数
         * @type {number}
         */
        this.aim_trained = 0;

        /** 玩家spd（速度）属性
         * @type {number}
         */
        this.spd = 1;

        /** 玩家spd训练次数
         * @type {number}
         */
        this.spd_trained = 0;

        /** 玩家acc（准度）属性
         * @type {number}
         */
        this.acc = 1;

        /** 玩家acc训练次数
         * @type {number}
         */
        this.acc_trained = 0;

        /** 玩家men（心态）属性
         * @type {number}
         */
        this.men = 1;

        /** 玩家men训练次数
         * @type {number}
         */
        this.men_trained = 0;

        /**
         * 玩家EZ mod熟练度
         * @type {number}
         */
        this.prf_EZ = 1;

        /** 玩家EZ mod训练次数
         * @type {number}
         */
        this.prf_EZ_trained = 0;

        /**
         * 玩家HD mod熟练度
         * @type {number}
         */
        this.prf_HD = 1;

        /** 玩家HD mod训练次数
         * @type {number}
         */
        this.prf_HD_trained = 0;

        /** 玩家训练点数
         * @type {number}
         */
        this.trainingPoints = 0;

        /** 玩家键盘等级，每提升1级对训练提升加成30%
         * @type {number}
         */
        this.keyboardLevel = 1;

        /** 玩家显示器等级，每提升1级对训练提升加成20%
         * @type {number}
         */
        this.monitorLevel = 1;

        /** 玩家主机等级，每提升1级对训练提升加成10%
         * @type {number}
         */
        this.pcLevel = 1;
    }

    /**
     * 玩家训练一次属性
     * @param {"aim" | "spd" | "acc" | "men" | "ez" | "hd"} type 训练类型
     */
    train(type) {
        let improvement = 0;
        if (this.trainingPoints <= 0) return 0;
        /**
        * 训练次数越多，再次训练收益越小
        * 第1次提升1，后续每次训练提升=0.526*0.95^N
        */
        const calImprove = (trainedCount) => {
            if (trainedCount <= 0) return 1;
            return 0.526 * Math.pow(0.95, trainedCount);
        };

        // 外设对训练提升
        const impbonus = 1 + (this.keyboardLevel - 1) * 0.3 + (this.monitorLevel - 1) * 0.2 + (this.pcLevel - 1) * 0.1;

        switch (type) {
            case "aim":
                improvement = calImprove(this.aim_trained) * impbonus;
                this.aim += improvement;
                this.aim_trained++;
                break;
            case "spd":
                improvement = calImprove(this.spd_trained) * impbonus;
                this.spd += improvement;
                this.spd_trained++;
                break;
            case "acc":
                improvement = calImprove(this.acc_trained) * impbonus;
                this.acc += improvement;
                this.acc_trained++;
                break;
            case "men":
                improvement = calImprove(this.men_trained) * impbonus;
                this.men += improvement;
                this.men_trained++;
                break;
            case "ez":
                improvement = calImprove(this.prf_EZ_trained) * impbonus;
                this.prf_EZ += improvement;
                this.prf_EZ_trained++;
                break;
            case "hd":
                improvement = calImprove(this.prf_HD_trained) * impbonus;
                this.prf_HD += improvement;
                this.prf_HD_trained++;
                break;
        }

        this.trainingPoints--;
        return improvement.toFixed(2);
    }

    /**
     * 生成对手时设置属性
     * @param {number} baseStar 对应比赛的基础难度
     */
    initEnemyStat(baseStar) {
        // 增加 20% 的随机浮动范围
        const randFactor = 0.2;
        this.aim = baseStar * (1 + (Math.random() * randFactor * 2) - randFactor);
        this.spd = baseStar * (1 + (Math.random() * randFactor * 2) - randFactor);
        this.acc = baseStar * (1 + (Math.random() * randFactor * 2) - randFactor);
        this.men = baseStar * (1 + (Math.random() * randFactor * 2) - randFactor);

        // 为对手添加 mod 熟练度
        this.prf_EZ = 1 + Math.random() * 2;
        this.prf_HD = 1 + Math.random() * 2;
    }

    /**
     * 选择训练活动，可以自由支配2个训练点
     */
    goTrain() {
        this.trainingPoints = 2;
        return this.trainingPoints;
    }

    /**
     * 选择工作活动，获得一定金钱
     */
    goWork(timeSlot) {
        let baseGain = 50 + 25 * Math.floor(this.workCount / 5);
        let gain = baseGain;

        // 晚上工作获得50%额外奖励
        if (timeSlot === 'evening') {
            gain = gain * 1.5;
        }

        this.money += gain;
        this.workCount += 1;
        return gain;
    }

    /**
     * 选择直播活动，获得一定金钱和能力提升
     */
    goWebcast(timeSlot) {
        let playerLevel = Math.floor((this.aim + this.spd + this.acc + this.prf_EZ + this.prf_HD) / 5);
        let baseMoneyGain = 10 + 5 * Math.floor(playerLevel / 2);
        let moneyGain = baseMoneyGain;

        // 晚上直播获得100%额外奖励
        if (timeSlot === 'evening') {
            moneyGain = baseMoneyGain * 2;
        }

        this.money += moneyGain;
        // 略微随机提升能力
        // 外设对训练提升
        const impbonus = 1 + (this.keyboardLevel - 1) * 0.3 + (this.monitorLevel - 1) * 0.2 + (this.pcLevel - 1) * 0.1;
        let aimGain = Math.random() * 0.1 * impbonus;
        this.aim += aimGain;
        let spdGain = Math.random() * 0.1 * impbonus;
        this.spd += spdGain;
        let accGain = Math.random() * 0.1 * impbonus;
        this.acc += accGain;
        let menGain = Math.random() * 0.1 * impbonus;
        this.men += menGain;
        let prf_EZGain = Math.random() * 0.1 * impbonus;
        this.prf_EZ += prf_EZGain;
        let prf_HDGain = Math.random() * 0.1 * impbonus;
        this.prf_HD += prf_HDGain;
        return { moneyGain, aimGain, spdGain, accGain, prf_EZGain, prf_HDGain };
    }
}