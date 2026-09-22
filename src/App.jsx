import React, { useState, useEffect } from 'react';
import './App.css';

const DIFFICULTY = {
  EASY: { id: 'EASY', name: '초급', rows: 8, cols: 8, mines: 10 },
  MEDIUM: { id: 'MEDIUM', name: '중급', rows: 12, cols: 12, mines: 20 },
  HARD: { id: 'HARD', name: '상급', rows: 16, cols: 16, mines: 40 },
  EXTREME: { id: 'EXTREME', name: '극악', rows: 20, cols: 20, mines: 60 },
  HARDCORE: { id: 'HARDCORE', name: '하드코어', rows: 24, cols: 24, mines: 105 },
};

const NUMBER_COLORS = {
  1: '#1976d2',
  2: '#388e3c',
  3: '#d32f2f',
  4: '#7b1fa2',
  5: '#ff8f00',
  6: '#00838f',
  7: '#424242',
  8: '#000000',
};

export default function App() {
  const [level, setLevel] = useState(DIFFICULTY.EASY);
  const [noFlagMode, setNoFlagMode] = useState(false);
  const [mobileFlagMode, setMobileFlagMode] = useState(false); // 모바일 터치용 깃발 모드
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [highlightedCells, setHighlightedCells] = useState([]); // 휠 클릭 시 하이라이트될 타일 목록

  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    resetGame();
  }, [level, noFlagMode]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const resetGame = () => {
    const newBoard = Array.from({ length: level.rows }, () =>
      Array.from({ length: level.cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );
    setBoard(newBoard);
    setGameOver(false);
    setGameWon(false);
    setFirstClick(true);
    setTimer(0);
    setIsTimerRunning(false);
    setHighlightedCells([]);
  };

  const isNeighbor = (r1, c1, r2, c2) => {
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
  };

  const placeMines = (startRow, startCol, currentBoard) => {
    let placedMines = 0;
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    while (placedMines < level.mines) {
      const r = Math.floor(Math.random() * level.rows);
      const c = Math.floor(Math.random() * level.cols);

      if (!isNeighbor(r, c, startRow, startCol) && !newBoard[r][c].isMine) {
        newBoard[r][c].isMine = true;
        placedMines++;
      }
    }

    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        if (!newBoard[r][c].isMine) {
          newBoard[r][c].neighborMines = countNeighborMines(r, c, newBoard);
        }
      }
    }

    return newBoard;
  };

  const countNeighborMines = (r, c, b) => {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) {
          if (b[nr][nc].isMine) count++;
        }
      }
    }
    return count;
  };

  // 깃발 모드 변경 함수
  const toggleMobileFlagMode = () => {
    if (noFlagMode) return;
    setMobileFlagMode((prev) => !prev);
  };

  // 타일 클릭 (좌클릭 / 터치)
  const handleCellClick = (r, c) => {
    if (gameOver || gameWon) return;

    // 모바일 깃발 모드가 켜진 경우 클릭으로 깃발 토글
    if (mobileFlagMode && !noFlagMode) {
      toggleFlag(r, c);
      return;
    }

    if (board[r][c].isRevealed) return;
    if (!noFlagMode && board[r][c].isFlagged) return;

    let currentBoard = board;

    if (firstClick) {
      currentBoard = placeMines(r, c, board);
      setFirstClick(false);
      setIsTimerRunning(true);
    }

    if (currentBoard[r][c].isMine) {
      revealAllMines(currentBoard);
      setGameOver(true);
      setIsTimerRunning(false);
      return;
    }

    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    revealCell(r, c, newBoard);
    setBoard(newBoard);

    checkWinCondition(newBoard);
  };

  // 깃발 토글 공통 로직
  const toggleFlag = (r, c) => {
    if (noFlagMode || gameOver || gameWon || board[r][c].isRevealed) return;

    const newBoard = board.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === r && ci === c) {
          return { ...cell, isFlagged: !cell.isFlagged };
        }
        return cell;
      })
    );
    setBoard(newBoard);
  };

  // 우클릭 (데스크톱)
  const handleContextMenu = (e, r, c) => {
    e.preventDefault();
    toggleFlag(r, c);
  };

  // 마우스 버튼 누름 (휠 누름 감지)
  const handleMouseDown = (e, r, c) => {
    if (e.button === 1) { // 1 = 마우스 휠 버튼 (Middle Click)
      e.preventDefault();
      if (!board[r][c].isRevealed || board[r][c].neighborMines === 0) return;

      // 주변 미오픈 타일 하이라이트 대상 지정
      const neighbors = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) {
            if (!board[nr][nc].isRevealed && !board[nr][nc].isFlagged) {
              neighbors.push(`${nr}-${nc}`);
            }
          }
        }
      }
      setHighlightedCells(neighbors);
    }
  };

  // 마우스 버튼 뗌 (휠 클릭 오프 동작)
  const handleMouseUp = (e, r, c) => {
    if (e.button === 1) {
      e.preventDefault();
      setHighlightedCells([]);

      if (gameOver || gameWon || !board[r][c].isRevealed || board[r][c].neighborMines === 0) return;

      // 주변 깃발 개수 세기
      let flaggedCount = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) {
            if (board[nr][nc].isFlagged) flaggedCount++;
          }
        }
      }

      // 주변 깃발 수가 셀의 지뢰 수와 일치할 때만 주변 타일 자동 오픈
      if (flaggedCount === board[r][c].neighborMines) {
        let newBoard = board.map(row => row.map(cell => ({ ...cell })));
        let hitMine = false;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) {
              if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
                if (newBoard[nr][nc].isMine) {
                  hitMine = true;
                } else {
                  revealCell(nr, nc, newBoard);
                }
              }
            }
          }
        }

        if (hitMine) {
          revealAllMines(newBoard);
          setGameOver(true);
          setIsTimerRunning(false);
        } else {
          setBoard(newBoard);
          checkWinCondition(newBoard);
        }
      }
    }
  };

  const revealCell = (r, c, b) => {
    if (r < 0 || r >= level.rows || c < 0 || c >= level.cols) return;
    if (b[r][c].isRevealed) return;
    if (!noFlagMode && b[r][c].isFlagged) return;

    b[r][c].isRevealed = true;

    if (b[r][c].neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            revealCell(r + dr, c + dc, b);
          }
        }
      }
    }
  };

  const revealAllMines = (b) => {
    const newBoard = b.map(row =>
      row.map(cell => ({
        ...cell,
        isRevealed: cell.isMine ? true : cell.isRevealed,
      }))
    );
    setBoard(newBoard);
  };

  const checkWinCondition = (b) => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        if (!b[r][c].isMine && !b[r][c].isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }
    if (unrevealedSafeCells === 0) {
      setGameWon(true);
      setIsTimerRunning(false);
    }
  };

  const formatTime = (seconds) => String(seconds).padStart(3, '0');

  return (
    <div className="minesweeper-app">
      <h1 className="title">💣 지뢰찾기</h1>

      {/* 난이도 버튼 */}
      <div className="difficulty-buttons">
        {Object.keys(DIFFICULTY).map((key) => (
          <button
            key={key}
            className={`btn-diff ${level.id === DIFFICULTY[key].id ? 'active' : ''}`}
            onClick={() => setLevel(DIFFICULTY[key])}
          >
            {DIFFICULTY[key].name}
          </button>
        ))}
      </div>

      {/* 노플래그 모드 토글 */}
      <div className="mode-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={noFlagMode}
            onChange={(e) => {
              setNoFlagMode(e.target.checked);
              if (e.target.checked) setMobileFlagMode(false);
            }}
          />
          <span className="toggle-text">🚫 노플래그 모드 (우클릭/깃발 불가)</span>
        </label>
      </div>

      {/* 모바일 배려: 깃발 모드 버튼 */}
      {!noFlagMode && (
        <div className="mobile-controls">
          <button
            className={`btn-flag-toggle ${mobileFlagMode ? 'active' : ''}`}
            onClick={toggleMobileFlagMode}
          >
            🚩 깃발 설치 모드: {mobileFlagMode ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      {/* 대시보드 */}
      <div className="dashboard">
        <div className="timer-box">
          ⏱️ <span className="timer-text">{formatTime(timer)}</span>
        </div>
        <button className="btn-reset" onClick={resetGame}>
          🔄 새 게임
        </button>
      </div>

      {/* 결과 메시지 */}
      <div className="status-container">
        {gameOver && <p className="msg fail">💥 지뢰를 밟았습니다! 게임 오버</p>}
        {gameWon && <p className="msg success">🎉 축하합니다! {timer}초 만에 성공했습니다!</p>}
      </div>

      {/* 보드판 */}
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${level.cols}, 30px)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isHighlighted = highlightedCells.includes(`${r}-${c}`);
            return (
              <button
                key={`${r}-${c}`}
                className={`cell ${cell.isRevealed ? 'revealed' : ''} ${
                  isHighlighted ? 'highlighted' : ''
                }`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                onMouseDown={(e) => handleMouseDown(e, r, c)}
                onMouseUp={(e) => handleMouseUp(e, r, c)}
                style={{
                  color:
                    cell.isRevealed && cell.neighborMines > 0
                      ? NUMBER_COLORS[cell.neighborMines]
                      : 'inherit',
                }}
              >
                {cell.isRevealed
                  ? cell.isMine
                    ? '💣'
                    : cell.neighborMines > 0
                    ? cell.neighborMines
                    : ''
                  : !noFlagMode && cell.isFlagged
                  ? '🚩'
                  : ''}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}