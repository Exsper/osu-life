class Shop {
    /**
     * 商店
     */
    constructor() {
        this.keyboardCost = [50, 100, 200, 400, 800];
        this.monitorCost = [100, 150, 250, 400];
        this.pcCost = [100, 200, 400, 600];
    }

    /**
     * 显示购买下一级键盘需要金额
     * @param {Player} player
     * @returns {number} 需要花费金额，-1为无法购买
     */
    showKeyboardCost(player) {
        let i = player.keyboardLevel - 1;
        if (i >= this.keyboardCost.length) return -1;
        else return this.keyboardCost[i];
    }

    buyKeyboard(player) {
        player.keyboardLevel += 1;
    }

    /**
     * 显示购买下一级显示器需要金额
     * @param {Player} player
     * @returns {number} 需要花费金额，-1为无法购买
     */
    showMonitorCost(player) {
        let i = player.monitorLevel - 1;
        if (i >= this.monitorCost.length) return -1;
        else return this.monitorCost[i];
    }

    buyMonitor(player) {
        player.monitorLevel += 1;
    }

    /**
     * 显示购买下一级主机需要金额
     * @param {Player} player
     * @returns {number} 需要花费金额，-1为无法购买
     */
    showPcCost(player) {
        let i = player.pcLevel - 1;
        if (i >= this.pcCost.length) return -1;
        else return this.pcCost[i];
    }

    buyPc(player) {
        player.pcLevel += 1;
    }
}