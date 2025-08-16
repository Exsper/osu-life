// 游戏主控制器
class GameController {
    constructor() {
        /**
         * @type {Game}
         */
        this.game = new Game();
        this.isTransitioning = false;
        this.currentScreen = 'main-menu';
        this.initEventListeners();
        this.updateUI();
        this.setupTooltips();
    }

    initEventListeners() {
        // 主菜单按钮
        document.getElementById('train-btn').addEventListener('click', () => {
            this.game.player.goTrain();
            this.showScreen('training-screen');
        });
        document.getElementById('work-btn').addEventListener('click', () => this.playerWork());
        document.getElementById('webcast-btn').addEventListener('click', () => this.playerWebcast());
        document.getElementById('rest-btn').addEventListener('click', () => this.playerRest());
        document.getElementById('shop-btn').addEventListener('click', () => this.showScreen('shop-screen'));

        // 返回按钮
        document.getElementById('complete-train').addEventListener('click', () => {
            this.showScreen('main-menu');
            this.nextTimeSlot();
        });
        document.getElementById('back-to-main-shop').addEventListener('click', () => this.showScreen('main-menu'));

        // 训练按钮
        document.querySelectorAll('.training-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.playerTrain(type);
            });
        });

        // 商店按钮
        document.getElementById('buy-keyboard').addEventListener('click', () => this.buyKeyboard());
        document.getElementById('buy-monitor').addEventListener('click', () => this.buyMonitor());
        document.getElementById('buy-pc').addEventListener('click', () => this.buyPc());

        // 比赛相关按钮
        document.getElementById('start-match-btn').addEventListener('click', () => this.showScreen('roll-screen'));
        document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
        document.getElementById('confirm-mods').addEventListener('click', () => this.confirmMods());
        document.getElementById('next-round-btn').addEventListener('click', () => this.nextRound());
        document.getElementById('continue-btn').addEventListener('click', () => this.continueAfterMatch());
        // 为mod按钮添加点击事件
        document.querySelectorAll('.mod-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 禁用状态检查
                if (!btn.disabled) {
                    btn.classList.toggle('active');
                }
            });
        });
    }

    showScreen(screenId) {
        // 隐藏当前屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 显示新屏幕
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;

        // 更新特定屏幕的内容
        if (screenId === 'training-screen') {
            this.updateTrainingScreen();
        } else if (screenId === 'shop-screen') {
            this.updateShopScreen();
        } else if (screenId === 'match-intro') {
            this.updateMatchIntro();
        }
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        // 显示toast
        setTimeout(() => toast.classList.add('show'), 10);

        // 1秒后移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 1000);
    }

    updateUI() {
        // 更新日期时间
        document.getElementById('current-day').textContent = this.game.day;
        document.getElementById('current-time').textContent = this.getTimeSlotText();

        // 更新界面风格
        document.body.classList.remove("morning");
        document.body.classList.remove("afternoon");
        document.body.classList.remove("evening");
        document.body.classList.add(this.game.timeSlot);

        // 更新玩家状态
        document.getElementById('money-stat').textContent = this.game.player.money.toFixed(0) + " G";

        const fatigueElem = document.getElementById('fatigue-stat');
        fatigueElem.textContent = this.game.player.fatigue + " %";
        if (this.game.player.fatigue >= 80) {
            fatigueElem.dataset.level = "high";
        } else if (this.game.player.fatigue >= 50) {
            fatigueElem.dataset.level = "medium";
        } else {
            fatigueElem.removeAttribute("data-level");
        }

        const keyboardBonus = (this.game.player.keyboardLevel - 1) * 30;
        const monitorBonus = (this.game.player.monitorLevel - 1) * 20;
        const pcBonus = (this.game.player.pcLevel - 1) * 10;
        document.getElementById('trian-bonus-stat').textContent = "+" + (keyboardBonus + monitorBonus + pcBonus) + " %";

        document.getElementById('aim-stat').textContent = this.game.player.aim.toFixed(2) + " ★";
        document.getElementById('spd-stat').textContent = this.game.player.spd.toFixed(2) + " ★";
        document.getElementById('acc-stat').textContent = this.game.player.acc.toFixed(2) + " ★";
        document.getElementById('men-stat').textContent = this.game.player.men.toFixed(2) + " ★";
        document.getElementById('ez-stat').textContent = this.game.player.prf_EZ.toFixed(2) + " ★";
        document.getElementById('hd-stat').textContent = this.game.player.prf_HD.toFixed(2) + " ★";

    }

    getTimeSlotText() {
        switch (this.game.timeSlot) {
            case 'morning': return '上午';
            case 'afternoon': return '下午';
            case 'evening': return '晚上';
            default: return this.game.timeSlot;
        }
    }

    playerTrain(type) {
        if (this.game.player.trainingPoints > 0) {
            const improvement = this.game.playerTrain(type);
            this.showToast(`训练成功! ${this.getTrainingName(type)} 提升了 ${improvement}`);
            this.updateTrainingScreen();
            this.updateTrainingCardTooltip(type); 
            this.updateUI();

            // 如果训练点为0，自动点击完成训练按钮
            if (this.game.player.trainingPoints === 0) {
                setTimeout(() => {
                    document.getElementById('complete-train').click();
                }, 100); // 短暂延迟确保UI更新完成
            }
        } else {
            this.showToast('没有足够的训练点数!');
        }
    }

    getTrainingName(type) {
        const names = {
            'aim': '精度(Aim)',
            'spd': '速度(Spd)',
            'acc': '准度(Acc)',
            'men': '心态(Men)',
            'ez': 'EZ Mod熟练度',
            'hd': 'HD Mod熟练度'
        };
        return names[type] || type;
    }

    updateTrainingScreen() {
        document.getElementById('remaining-points').textContent = this.game.player.trainingPoints;
    }

    playerWork() {
        const gain = this.game.playerWork();
        this.showToast(`工作完成! 赚取了 ${gain} 金钱`);
        this.updateWorkTooltip();
        this.nextTimeSlot();
    }

    playerWebcast() {
        const result = this.game.playerWebcast();
        this.showToast(`直播完成! 赚取了 ${result.moneyGain} 金钱，并提升了技能`);
        this.updateWebcastTooltip();
        this.nextTimeSlot();
    }

    playerRest() {
        const deltaFatigue = this.game.playerRest();
        this.showToast(`休息一会儿，疲劳度降低 ${-deltaFatigue}`);
        this.updateRestTooltip(); 
        this.nextTimeSlot();
        this.updateUI();
    }

    updateShopScreen() {
        // 更新金钱显示
        document.getElementById('shop-money').textContent = this.game.player.money.toFixed(0);

        // 计算键盘加成百分比（每级30%）
        const keyboardBonus = (this.game.player.keyboardLevel - 1) * 30;
        document.getElementById('keyboard-level').innerHTML =
            `${this.game.player.keyboardLevel} <span style="font-size:0.8em">(训练效果+${keyboardBonus}%)</span>`;

        // 计算显示器加成百分比（每级20%）
        const monitorBonus = (this.game.player.monitorLevel - 1) * 20;
        document.getElementById('monitor-level').innerHTML =
            `${this.game.player.monitorLevel} <span style="font-size:0.8em">(训练效果+${monitorBonus}%)</span>`;

        // 计算主机加成百分比（每级10%）
        const pcBonus = (this.game.player.pcLevel - 1) * 10;
        document.getElementById('pc-level').innerHTML =
            `${this.game.player.pcLevel} <span style="font-size:0.8em">(训练效果+${pcBonus}%)</span>`;

        const keyboardCost = this.game.shop.showKeyboardCost(this.game.player);
        const monitorCost = this.game.shop.showMonitorCost(this.game.player);
        const pcCost = this.game.shop.showPcCost(this.game.player);

        document.getElementById('keyboard-cost').textContent = keyboardCost !== -1 ? keyboardCost : '已满级';
        document.getElementById('monitor-cost').textContent = monitorCost !== -1 ? monitorCost : '已满级';
        document.getElementById('pc-cost').textContent = pcCost !== -1 ? pcCost : '已满级';
    }

    buyKeyboard() {
        if (this.game.buyKeyboard()) {
            this.showToast('键盘升级成功!');
            this.updateShopScreen();
            this.updateUI();
        } else {
            this.showToast('金钱不足或已达最高等级!');
        }
    }

    buyMonitor() {
        if (this.game.buyMonitor()) {
            this.showToast('显示器升级成功!');
            this.updateShopScreen();
            this.updateUI();
        } else {
            this.showToast('金钱不足或已达最高等级!');
        }
    }

    buyPc() {
        if (this.game.buyPc()) {
            this.showToast('主机升级成功!');
            this.updateShopScreen();
            this.updateUI();
        } else {
            this.showToast('金钱不足或已达最高等级!');
        }
    }

    nextTimeSlot() {
        if (this.game.timeSlot === "evening") {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.showDayTransition();
            setTimeout(() => {
                this.game.nextTimeSlot();
                this.updateUI();
                this.hideDayTransition();
                this.showScreen('main-menu');
                this.isTransitioning = false;
            }, 1000);
        }
        else {
            this.game.nextTimeSlot();
            this.updateUI();

            // 如果进入比赛日并且是晚上，显示比赛介绍界面
            if (this.game.isMatchDay() && this.game.timeSlot === 'evening') {
                this.startMatch();
                this.showScreen('match-intro');
            } else {
                this.showScreen('main-menu');
            }
        }
    }

    // 计算下一日距比赛天数
    getDaysToNextMatch(currentDay) {
        const matchDays = this.game.matchDays;

        // 查找下一个比赛日
        const nextMatchDay = matchDays.find(day => day >= currentDay);

        if (nextMatchDay) {
            return nextMatchDay - currentDay;
        }
        // 如果当前是最后一天或之后没有比赛日
        return -1;
    }

    showDayTransition() {
        const transition = document.getElementById('day-transition');
        const dayElement = document.getElementById('transition-day');
        const daysToMatchElement = document.getElementById('days-to-match');

        const nextDay = this.game.day + 1;
        dayElement.textContent = nextDay;

        // 计算距比赛天数
        const daysToMatch = this.getDaysToNextMatch(nextDay);

        // 设置提示文字
        if (daysToMatch === 0) {
            daysToMatchElement.textContent = "今晚比赛！";
        } else if (daysToMatch > 0) {
            daysToMatchElement.textContent = `距比赛还有 ${daysToMatch} 天`;
        } else {
            daysToMatchElement.textContent = "比赛已全部结束";
        }

        transition.classList.add('active');
    }

    hideDayTransition() {
        setTimeout(() => {
            document.getElementById('day-transition').classList.remove('active');
        }, 1000);
    }

    startMatch() {
        this.game.startMatch();
    }

    updateMatchIntro() {
        const opponent = this.game.currentMatch.enemy;
        document.getElementById('match-name').textContent = this.game.getMatchName();
        document.getElementById('opponent-aim').textContent = opponent.aim.toFixed(1);
        document.getElementById('opponent-spd').textContent = opponent.spd.toFixed(1);
        document.getElementById('opponent-acc').textContent = opponent.acc.toFixed(1);
        document.getElementById('opponent-men').textContent = opponent.men.toFixed(1);

        // 设置难度星级
        const difficulty = Math.floor(this.game.currentMatch.baseStar / 1.3);
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += i < difficulty ? '★' : '☆';
        }
        document.getElementById('match-difficulty').textContent = stars;
    }

    rollDice() {
        this.game.advanceMatch();

        document.getElementById('player-roll').textContent = this.game.currentMatch.playerRoll;
        document.getElementById('enemy-roll').textContent = this.game.currentMatch.enemyRoll;

        let resultText = '';
        if (this.game.currentMatch.playerRoll > this.game.currentMatch.enemyRoll) {
            resultText = '你先ban图，对手先选图';
        } else {
            resultText = '对手先ban图，你先选图';
        }

        document.getElementById('roll-result').textContent = resultText;

        // 自动进入ban图阶段
        setTimeout(() => {
            this.showScreen('ban-screen');
            this.updateBanScreen();
        }, 2000);
    }

    updateBanScreen() {
        document.getElementById('ban-remaining').textContent =
            this.game.currentMatch.banSlots - this.game.currentMatch.playerUsedBan;

        document.getElementById('ban-turn').textContent =
            this.game.currentMatch.currentTurn === 'player' ? '你的回合' : '对手回合';

        // 生成谱面卡片
        const container = document.getElementById('ban-beatmaps');
        container.innerHTML = '';

        const beatmaps = this.game.currentMatch.getAllBeatmaps();
        beatmaps.forEach(beatmap => {
            const card = document.createElement('div');
            card.className = 'beatmap-card';
            card.dataset.id = beatmap.id;

            if (beatmap.banned) {
                card.classList.add('banned');
                if (beatmap.bannedBy === 'player') {
                    card.classList.add('player-action');
                } else {
                    card.classList.add('enemy-action');
                }
            } else if (beatmap.picked) {
                card.classList.add('picked');
                if (beatmap.pickedBy === 'player') {
                    card.classList.add('player-action');
                } else {
                    card.classList.add('enemy-action');
                }
            }

            card.innerHTML = beatmap.getInnerHTML();

            // 添加点击事件（非TB、仅当未被ban且轮到玩家时）
            if (beatmap.poolType != "TB" && !beatmap.banned && this.game.currentMatch.currentTurn === 'player') {
                card.addEventListener('click', () => {
                    this.banBeatmap(beatmap.id);
                });
            }

            container.appendChild(card);
        });

        // 如果是对手回合，自动ban图
        if (this.game.currentMatch.currentTurn === 'enemy') {
            setTimeout(() => {
                this.game.advanceMatch();
                this.updateBanScreen();

                // 检查是否进入选图阶段
                if (this.game.currentMatch.currentStep === 'pick') {
                    this.showScreen('pick-screen');
                    this.updatePickScreen();
                }
            }, 1500);
        }
    }

    banBeatmap(bid) {
        if (this.game.playerBan(bid)) {
            this.updateBanScreen();

            // 检查是否进入选图阶段
            if (this.game.currentMatch.currentStep === 'pick') {
                this.showScreen('pick-screen');
                this.updatePickScreen();
            }
        }
    }

    updatePickScreen() {
        document.getElementById('pick-turn').textContent =
            this.game.currentMatch.currentTurn === 'player' ? '你的回合' : '对手回合';

        // 生成谱面卡片
        const container = document.getElementById('pick-beatmaps');
        container.innerHTML = '';

        const beatmaps = this.game.currentMatch.getAllBeatmaps();
        beatmaps.forEach(beatmap => {
            const card = document.createElement('div');
            card.className = 'beatmap-card';
            card.dataset.id = beatmap.id;

            if (beatmap.banned) {
                card.classList.add('banned');
                if (beatmap.bannedBy === 'player') {
                    card.classList.add('player-action');
                } else {
                    card.classList.add('enemy-action');
                }
            } else if (beatmap.picked) {
                card.classList.add('picked');
                if (beatmap.pickedBy === 'player') {
                    card.classList.add('player-action');
                } else {
                    card.classList.add('enemy-action');
                }
            }

            card.innerHTML = beatmap.getInnerHTML();

            // 添加点击事件（非TB、仅当未被ban/pick且轮到玩家时）
            if (beatmap.poolType != "TB" && !beatmap.banned && !beatmap.picked && this.game.currentMatch.currentTurn === 'player') {
                card.addEventListener('click', () => {
                    this.pickBeatmap(beatmap.id);
                });
            }

            container.appendChild(card);
        });

        // 如果是对手回合，自动选图
        if (this.game.currentMatch.currentTurn === 'enemy') {
            setTimeout(() => {
                this.game.currentMatch.enemyPickBeatmap();
                this.prepareModSelection();
                this.showScreen('mods-screen');
            }, 1500);
        }
    }

    pickBeatmap(bid) {
        const beatmap = this.game.playerPick(bid);
        if (beatmap) {
            this.prepareModSelection();
            this.showScreen('mods-screen');
        }
    }

    prepareModSelection() {
        const currentMap = this.game.currentMatch.currentBeatmap;
        if (currentMap) {
            // 更新mod选择界面
            document.getElementById('selected-map-name').textContent = `谱面 #${currentMap.id}`;
            document.getElementById('map-type').textContent = currentMap.poolType;
            document.getElementById('map-aim').textContent = currentMap.basic_aim_rating.toFixed(2);
            document.getElementById('map-spd').textContent = currentMap.basic_spd_rating.toFixed(2);
            document.getElementById('map-acc').textContent = currentMap.basic_acc_rating.toFixed(2);
            document.getElementById('map-combo').textContent = currentMap.maxcombo_rating.toFixed(2);

            // 获取mod按钮
            const hrBtn = document.querySelector('.mod-btn[data-mod="hr"]');
            const hdBtn = document.querySelector('.mod-btn[data-mod="hd"]');

            // 重置所有mod按钮状态
            hrBtn.classList.remove('active');
            hrBtn.classList.remove('disabled');
            hdBtn.classList.remove('active');
            hdBtn.classList.remove('disabled');
            hrBtn.disabled = false;
            hdBtn.disabled = false;

            // 根据图池类型设置mod按钮状态
            switch (currentMap.poolType) {
                case "EZ": {
                    hrBtn.disabled = true; // 禁用HR按钮
                    hrBtn.classList.add('disabled');
                    break;
                }
                case "DT": {
                    hrBtn.disabled = true; // 禁用HR按钮
                    hrBtn.classList.add('disabled');
                    break;
                }
                case 'HR':
                    hrBtn.classList.add('active');
                    hrBtn.disabled = true; // 禁用HR按钮
                    hrBtn.classList.add('disabled');
                    break;
                case 'HD':
                    hdBtn.classList.add('active');
                    hrBtn.disabled = true; // 禁用HR按钮
                    hrBtn.classList.add('disabled');
                    hdBtn.disabled = true; // 禁用HD按钮
                    hdBtn.classList.add('disabled');
                    break;
                case 'FM':
                case 'TB':
                    // 允许自由选择HR和HD
                    break;
                default:
                    // NM禁用所有mod按钮
                    hrBtn.disabled = true;
                    hrBtn.classList.add('disabled');
                    hdBtn.disabled = true;
                    hdBtn.classList.add('disabled');
            }

            this.showScreen('mods-screen');

            // 对手自动选择mods
            this.game.advanceMatch();
        }
    }

    confirmMods() {
        const hrSelected = document.querySelector('.mod-btn[data-mod="hr"]').classList.contains('active');
        const hdSelected = document.querySelector('.mod-btn[data-mod="hd"]').classList.contains('active');

        const currentMap = this.game.currentMatch.currentBeatmap;
        if (currentMap) {
            this.game.playerSelectMods(currentMap.id, { HR: hrSelected, HD: hdSelected });

            // 开始比赛回合
            this.showScreen('result-screen');
            this.startRound();
        }
    }

    startRound() {
        const result = this.game.startRound();
        if (result) {
            document.getElementById('player-score').textContent = Math.round(result.playerScore);
            document.getElementById('enemy-score').textContent = Math.round(result.enemyScore);

            if (result.roundWinner === 'player') {
                document.getElementById('round-winner').textContent = '你赢了这一回合!';
                document.getElementById('round-winner').className = 'result-title win';
            } else {
                document.getElementById('round-winner').textContent = '对手赢了这一回合!';
                document.getElementById('round-winner').className = 'result-title lose';
            }

            document.getElementById('player-win-count').textContent = result.playerWinRound;
            document.getElementById('enemy-win-count').textContent = result.enemyWinRound;
        }
    }

    showFinalResult(result) {
        document.getElementById('final-player-score').textContent = result.playerWinRound;
        document.getElementById('final-enemy-score').textContent = result.enemyWinRound;

        if (result.playerWinRound > result.enemyWinRound) {
            document.getElementById('match-result-title').textContent = '胜利!';
            document.getElementById('final-result-text').textContent = '恭喜你赢得比赛!';
            document.getElementById('final-result-text').className = 'result-title win';
        } else {
            document.getElementById('match-result-title').textContent = '失败!';
            document.getElementById('final-result-text').textContent = '很遗憾，你输掉了比赛';
            document.getElementById('final-result-text').className = 'result-title lose';
        }

        this.game.clearMatch();
        // 重置网页元素
        document.getElementById('player-roll').textContent = "-";
        document.getElementById('enemy-roll').textContent = "-";

        this.showScreen('final-result');
    }

    nextRound() {
        if (this.game.currentMatch.ended) {
            this.showFinalResult({
                playerWinRound: this.game.currentMatch.playerWinRound,
                enemyWinRound: this.game.currentMatch.enemyWinRound
            });
        } else {
            this.showScreen('pick-screen');
            this.updatePickScreen();
        }
    }

    continueAfterMatch() {
        if (this.game.gameOver) {
            this.showToast('游戏结束! 请刷新页面重新开始');
            return;
        }

        this.nextTimeSlot();
        this.updateUI();
        this.showScreen('main-menu');
    }

    setupTooltips() {
        // 训练按钮
        document.getElementById('train-btn').addEventListener('mouseover', () => {
            this.updateTrainTooltip();
        });

        // 工作按钮
        document.getElementById('work-btn').addEventListener('mouseover', () => {
            this.updateWorkTooltip();
        });

        // 直播按钮
        document.getElementById('webcast-btn').addEventListener('mouseover', () => {
            this.updateWebcastTooltip();
        });

        // 休息按钮
        document.getElementById('rest-btn').addEventListener('mouseover', () => {
            this.updateRestTooltip();
        });

        // 商店按钮
        document.getElementById('shop-btn').addEventListener('mouseover', () => {
            this.updateShopTooltip();
        });

        // 训练卡片
        document.querySelectorAll('.training-card').forEach(card => {
            card.addEventListener('mouseover', (e) => {
                const type = e.currentTarget.dataset.type;
                this.updateTrainingCardTooltip(type);
            });
        });
    }

    // 训练按钮提示
    updateTrainTooltip() {
        const tooltip = document.getElementById('train-tooltip');
        tooltip.textContent = `训练点数: +2\n------------------\n进入选择训练项目`;
    }

    // 工作按钮提示
    updateWorkTooltip() {
        const player = this.game.player;
        const baseGain = 50 + 25 * Math.floor(player.workCount / 5);
        const penalty = getFatiguePenalty(player.fatigue);
        const isEvening = this.game.timeSlot === 'evening';
        const actualGain = baseGain * penalty * (isEvening ? 1.5 : 1);

        let text = `原始金钱: ${player.money.toFixed(0)} G\n`;
        text += `------------------\n`;
        text += `已工作次数: ${player.workCount}\n`;
        text += `基础工资: +${baseGain.toFixed(0)}\n`;
        text += `疲劳度惩罚: x${penalty.toFixed(1)}\n`;
        if (isEvening) {
            text += `夜班奖励: x1.5\n`;
        }
        text += `------------------\n`;
        text += `最终金钱: ${actualGain.toFixed(0)} G\n`;
        text += `------------------\n`;
        text += `疲劳度: +${FATIGUE_GAIN.WORK}`;

        document.getElementById('work-tooltip').textContent = text;
    }

    // 直播按钮提示
    updateWebcastTooltip() {
        const player = this.game.player;
        const playerLevel = Math.floor((player.aim + player.spd + player.acc + player.prf_EZ + player.prf_HD) / 5);
        const baseMoneyGain = 10 + 5 * Math.floor(playerLevel / 2);
        const penalty = getFatiguePenalty(player.fatigue);
        const isEvening = this.game.timeSlot === 'evening';
        const actualGain = baseMoneyGain * penalty * (isEvening ? 2 : 1);

        let text = `原始金钱: ${player.money.toFixed(0)} G\n`;
        text += `------------------\n`;
        text += `游戏水平: ${playerLevel}★\n`;
        text += `基础工资: +${baseMoneyGain.toFixed(0)}\n`;
        text += `疲劳度惩罚: x${penalty.toFixed(1)}\n`;
        if (isEvening) {
            text += `夜晚奖励: x2.0\n`;
        }
        text += `------------------\n`;
        text += `最终金钱: ${actualGain.toFixed(0)} G\n`;
        text += `各项数值小幅提升\n`;
        text += `------------------\n`;
        text += `疲劳度: +${FATIGUE_GAIN.WEBCAST}`;

        document.getElementById('webcast-tooltip').textContent = text;
    }

    // 休息按钮提示
    updateRestTooltip() {
        let text = `当前疲劳度: ${this.game.player.fatigue}%\n`;
        text += `------------------\n`;
        text += `休息效果: -${-FATIGUE_GAIN.REST}\n`;
        text += `------------------\n`;
        text += `最终疲劳度: ${Math.max(0, this.game.player.fatigue + FATIGUE_GAIN.REST)}%`;

        document.getElementById('rest-tooltip').textContent = text;
    }

    // 商店按钮提示
    updateShopTooltip() {
        let text = `进入商店升级设备`;

        document.getElementById('shop-tooltip').textContent = text;
    }

    // 训练卡片提示
    updateTrainingCardTooltip(type) {
        let playerItem = type;
        if (type === "ez") playerItem = "prf_EZ";
        else if (type === "hd") playerItem = "prf_HD";
        const player = this.game.player;
        const trainedCount = player[`${playerItem}_trained`];

        // 计算基础提升值
        const baseImprove = trainedCount <= 0 ? 1 : 0.526 * Math.pow(0.95, trainedCount);

        // 计算外设加成
        const impbonus = 1 +
            (player.keyboardLevel - 1) * 0.3 +
            (player.monitorLevel - 1) * 0.2 +
            (player.pcLevel - 1) * 0.1;

        const finalImprove = baseImprove * impbonus;

        // 获取属性当前值
        const currentValue = player[playerItem].toFixed(2);
        const newValue = (player[playerItem] + finalImprove).toFixed(2);

        // 获取训练类型名称
        const typeNames = {
            aim: '精度(Aim)',
            spd: '速度(Spd)',
            acc: '准度(Acc)',
            men: '心态(Men)',
            ez: 'EZ Mod熟练度',
            hd: 'HD Mod熟练度'
        };

        let text = `${typeNames[type] || type}\n`;
        text += `------------------\n`;
        text += `原始数值: ${currentValue}★\n`;
        text += `已训练次数: ${trainedCount}\n`;
        text += `基础提升: +${baseImprove.toFixed(2)}\n`;
        text += `外设加成: x${impbonus.toFixed(2)}\n`;
        text += `------------------\n`;
        text += `最终数值: ${newValue}★\n`;
        text += `------------------\n`;
        text += `疲劳度: +${FATIGUE_GAIN.TRAIN}`;

        document.getElementById(`training-${type}-tooltip`).textContent = text;
    }
}
