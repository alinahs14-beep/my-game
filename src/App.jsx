import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { soundCtrl } from './utils/audio';
import { triggerConfetti } from './utils/confetti';

// 8 組精心挑選的生動圖案 (共 16 張)
const CARD_ITEMS = [
  { icon: '🚀', name: '火箭' },
  { icon: '💎', name: '鑽石' },
  { icon: '🪐', name: '行星' },
  { icon: '🦄', name: '獨角獸' },
  { icon: '⚡', name: '閃電' },
  { icon: '🍀', name: '幸運草' },
  { icon: '🔮', name: '水晶球' },
  { icon: '🍕', name: '披薩' },
];

function generateShuffledCards() {
  const deck = [];
  CARD_ITEMS.forEach((item, index) => {
    // 每一種圖案產生 2 張卡片，形成配對
    deck.push({
      id: `${index}-a`,
      matchId: index,
      icon: item.icon,
      name: item.name,
      isFlipped: false,
      isMatched: false,
    });
    deck.push({
      id: `${index}-b`,
      matchId: index,
      icon: item.icon,
      name: item.name,
      isFlipped: false,
      isMatched: false,
    });
  });

  // Fisher-Yates 洗牌演算法
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export default function App() {
  const [cards, setCards] = useState(() => generateShuffledCards());
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 最佳紀錄存取 (LocalStorage)
  const [bestRecord, setBestRecord] = useState(() => {
    try {
      const saved = localStorage.getItem('memory_game_best_record');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 計時器邏輯
  useEffect(() => {
    let timerId = null;
    if (isPlaying && !isCompleted) {
      timerId = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, isCompleted]);

  // 格式化時間 (分:秒)
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 重新開始遊戲
  const restartGame = useCallback(() => {
    setCards(generateShuffledCards());
    setFlippedIndices([]);
    setMoves(0);
    setSeconds(0);
    setIsPlaying(false);
    setIsCompleted(false);
    setIsProcessing(false);
  }, []);

  // 切換音效
  const toggleSound = () => {
    const nextState = soundCtrl.toggleSound();
    setSoundEnabled(nextState);
  };

  // 點擊卡片
  const handleCardClick = (index) => {
    // 若正在處理比對、卡片已翻開或已配對，則不予處理
    if (isProcessing) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length >= 2) return;

    // 第一次翻牌開始計時
    if (!isPlaying) {
      setIsPlaying(true);
    }

    soundCtrl.playFlip();

    // 翻開該卡片
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // 當翻開第二張牌時進行判定
    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setMoves((prev) => prev + 1);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.matchId === secondCard.matchId) {
        // 配對成功！
        setTimeout(() => {
          soundCtrl.playMatch();
          setCards((prevDeck) => {
            const updated = [...prevDeck];
            updated[firstIdx] = { ...updated[firstIdx], isMatched: true };
            updated[secondIdx] = { ...updated[secondIdx], isMatched: true };

            // 檢查是否全部配對完成 (8 組共 16 張)
            const allMatched = updated.every((c) => c.isMatched);
            if (allMatched) {
              handleGameWin(moves + 1);
            }
            return updated;
          });

          setFlippedIndices([]);
          setIsProcessing(false);
        }, 350);
      } else {
        // 配對失敗，短暫停留後蓋回
        setTimeout(() => {
          soundCtrl.playMismatch();
          setCards((prevDeck) => {
            const updated = [...prevDeck];
            updated[firstIdx] = { ...updated[firstIdx], isFlipped: false };
            updated[secondIdx] = { ...updated[secondIdx], isFlipped: false };
            return updated;
          });
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 850);
      }
    }
  };

  // 獲勝處理
  const handleGameWin = (finalMoves) => {
    setIsCompleted(true);
    setIsPlaying(false);
    soundCtrl.playWin();
    triggerConfetti();

    // 更新並儲存最佳紀錄
    setBestRecord((currentBest) => {
      let isNewRecord = false;
      if (!currentBest) {
        isNewRecord = true;
      } else if (finalMoves < currentBest.moves) {
        isNewRecord = true;
      } else if (finalMoves === currentBest.moves && seconds < currentBest.seconds) {
        isNewRecord = true;
      }

      if (isNewRecord) {
        const record = { moves: finalMoves, seconds };
        try {
          localStorage.setItem('memory_game_best_record', JSON.stringify(record));
        } catch {
          // ignore
        }
        return record;
      }
      return currentBest;
    });
  };

  // 計算星級 (以步數為基準)
  const getRatingStars = () => {
    if (moves <= 12) return '⭐⭐⭐';
    if (moves <= 18) return '⭐⭐';
    return '⭐';
  };

  // 已成功配對的組數
  const matchedPairsCount = cards.filter((c) => c.isMatched).length / 2;

  return (
    <div className="game-container">
      {/* 標題與簡介 */}
      <header className="game-header">
        <h1 className="game-title">
          <span>🧠</span> 記憶翻牌大挑戰
        </h1>
        <p className="game-subtitle">翻轉卡片找出相同圖案，考驗你的專注與記憶力！</p>
      </header>

      {/* 狀態數據列 (計時器、步數、配對進度) */}
      <div className="stats-panel">
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <span className="stat-label">遊戲計時</span>
          <span className="stat-value">{formatTime(seconds)}</span>
        </div>

        <div className="stat-card">
          <span className="stat-icon">👟</span>
          <span className="stat-label">翻牌步數</span>
          <span className="stat-value">{moves} 步</span>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <span className="stat-label">已配對數</span>
          <span className="stat-value">{matchedPairsCount} / 8</span>
        </div>
      </div>

      {/* 操作控制列 */}
      <div className="controls-bar">
        {bestRecord ? (
          <div className="best-record-badge" title="歷史最佳紀錄">
            <span>🏆</span> 最佳: {bestRecord.moves} 步 ({formatTime(bestRecord.seconds)})
          </div>
        ) : (
          <div className="best-record-badge">
            <span>🏆</span> 最佳紀錄: 尚未完成
          </div>
        )}

        <div className="actions-group">
          <button
            type="button"
            className="btn btn-icon"
            onClick={toggleSound}
            title={soundEnabled ? '點擊靜音' : '點擊開啟音效'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <button
            type="button"
            className="btn btn-restart"
            onClick={restartGame}
          >
            🔄 重新開始
          </button>
        </div>
      </div>

      {/* 16 張卡牌網格 (4x4) */}
      <main className="card-grid" role="region" aria-label="翻牌遊戲區">
        {cards.map((card, index) => {
          const isFlippedOrMatched = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.id}
              className="card-wrapper"
              onClick={() => handleCardClick(index)}
            >
              <div
                className={`card-inner ${isFlippedOrMatched ? 'is-flipped' : ''} ${
                  card.isMatched ? 'is-matched' : ''
                }`}
              >
                {/* 卡片背面 (未翻開) */}
                <div className="card-face card-back">
                  <span className="card-back-icon">❓</span>
                </div>

                {/* 卡片正面 (翻開或消除後) */}
                <div className="card-face card-front">
                  <span role="img" aria-label={card.name}>
                    {card.icon}
                  </span>
                  {card.isMatched && <span className="matched-check">✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* 全部消除完成彈出視窗 */}
      {isCompleted && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-badge">🎉</div>
            <h2 className="modal-title">恭喜完成挑戰！</h2>
            <div className="modal-stars">{getRatingStars()}</div>

            <div className="modal-stats-grid">
              <div className="modal-stat-box">
                <div className="modal-stat-label">總耗時</div>
                <div className="modal-stat-value">{formatTime(seconds)}</div>
              </div>
              <div className="modal-stat-box">
                <div className="modal-stat-label">總步數</div>
                <div className="modal-stat-value">{moves} 步</div>
              </div>
            </div>

            <button
              type="button"
              className="modal-btn-restart"
              onClick={restartGame}
            >
              <span>🔄</span> 再玩一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
