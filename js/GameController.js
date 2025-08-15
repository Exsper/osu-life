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
    }

    initEventListeners() {
        // 主菜单按钮
        document.getElementById('train-btn').addEventListener('click', () => {
            this.game.player.goTrain();
            this.showScreen('training-screen');
        });
        document.getElementById('work-btn').addEventListener('click', () => this.playerWork());
        document.getElementById('webcast-btn').addEventListener('click', () => this.playerWebcast());
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

    updateUI() {
        // 更新日期时间
        document.getElementById('current-day').textContent = this.game.day;
        document.getElementById('current-time').textContent = this.getTimeSlotText();

        // 更新界面风格
        document.body.classList.remove("morning");
        document.body.classList.remove("afternoon");
        document.body.classList.remove("evening");
        if (!this.game.isMatchDay()) document.body.classList.add(this.game.timeSlot);

        // 更新玩家状态
        document.getElementById('money-stat').textContent = this.game.player.money.toFixed(0) + " G";
        document.getElementById('aim-stat').textContent = this.game.player.aim.toFixed(2) + " ★";
        document.getElementById('spd-stat').textContent = this.game.player.spd.toFixed(2) + " ★";
        document.getElementById('acc-stat').textContent = this.game.player.acc.toFixed(2) + " ★";
        document.getElementById('men-stat').textContent = this.game.player.men.toFixed(2) + " ★";
        document.getElementById('ez-stat').textContent = this.game.player.prf_EZ.toFixed(2) + " ★";
        document.getElementById('hd-stat').textContent = this.game.player.prf_HD.toFixed(2) + " ★";

        // 检查是否是比赛日
        if (this.game.isMatchDay() && this.currentScreen !== 'match-intro') {
            this.startMatch();
            this.showScreen('match-intro');
        }
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
            alert(`训练成功! ${this.getTrainingName(type)} 提升了 ${improvement}`);
            this.updateTrainingScreen();
            this.updateUI();
        } else {
            alert('没有足够的训练点数!');
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
        alert(`工作完成! 赚取了 ${gain} 金钱`);
        this.nextTimeSlot();
    }

    playerWebcast() {
        const result = this.game.playerWebcast();
        alert(`直播完成! 赚取了 ${result.moneyGain} 金钱，并提升了技能`);
        this.nextTimeSlot();
    }

    updateShopScreen() {
        document.getElementById('keyboard-level').textContent = this.game.player.keyboardLevel;
        document.getElementById('monitor-level').textContent = this.game.player.monitorLevel;
        document.getElementById('pc-level').textContent = this.game.player.pcLevel;

        const keyboardCost = this.game.shop.showKeyboardCost(this.game.player);
        const monitorCost = this.game.shop.showMonitorCost(this.game.player);
        const pcCost = this.game.shop.showPcCost(this.game.player);

        document.getElementById('keyboard-cost').textContent = keyboardCost !== -1 ? keyboardCost : '已满级';
        document.getElementById('monitor-cost').textContent = monitorCost !== -1 ? monitorCost : '已满级';
        document.getElementById('pc-cost').textContent = pcCost !== -1 ? pcCost : '已满级';
    }

    buyKeyboard() {
        if (this.game.buyKeyboard()) {
            alert('键盘升级成功!');
            this.updateShopScreen();
            this.updateUI();
        } else {
            alert('金钱不足或已达最高等级!');
        }
    }

    buyMonitor() {
        if (this.game.buyMonitor()) {
            alert('显示器升级成功!');
            this.updateShopScreen();
            this.updateUI();
        } else {
            alert('金钱不足或已达最高等级!');
        }
    }

    buyPc() {
        if (this.game.buyPc()) {
            alert('主机升级成功!');
            this.updateShopScreen();
            this.updateUI();
        } else {
            alert('金钱不足或已达最高等级!');
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

                // 如果进入比赛日，显示比赛介绍界面
                if (this.game.isMatchDay()) {
                    this.showScreen('match-intro');
                } else {
                    this.showScreen('main-menu');
                }
                this.isTransitioning = false;
            }, 1000);
        }
        else {
            this.game.nextTimeSlot();
            this.updateUI();
        }
    }

    showDayTransition() {
        const transition = document.getElementById('day-transition');
        const dayElement = document.getElementById('transition-day');

        dayElement.textContent = this.game.day + 1;
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
        const difficulty = Math.floor(this.game.currentMatch.baseStar / 2);
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

            // 检查比赛是否结束
            if (result.ended) {
                setTimeout(() => {
                    this.showFinalResult(result);
                }, 3000);
            }
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
            alert('游戏结束! 请刷新页面重新开始');
            return;
        }

        this.game.nextTimeSlot();
        this.updateUI();
        this.showScreen('main-menu');
    }
}
