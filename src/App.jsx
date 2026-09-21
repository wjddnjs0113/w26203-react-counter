import React, { useState, useEffect } from 'react';
import './App.css';

// 난이도 설정
const DIFFICULTY = {
  EASY: { name: '초급', rows: 8, cols: 8, mines: 10 },
  MEDIUM: { name: '중급', rows: 12, cols: 12, mines: 20 },
  HARD: { name: '상급', rows: 16, cols: 16, mines: 40 },
};

// 주변 지뢰 개수별 글자 색상
const NUMBER_COLORS = {
  1: '#1976d2', // 파랑
  2: '#388e3c', // 초록
  3: '#d32f2f', // 빨강
  4: '#7b1fa2', // 보라
  5: '#ff8f00', // 주황
  6: '#00838f', // 청록
  7: '#424242', // 회색
  8: '#000000', // 검정
};

export default function App() {
  const [level, setLevel] = useState(DIFFICULTY.EASY);
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);

  useEffect(() => {
    resetGame();
  }, [level]);

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
  };

  // 첫 클릭 시 지뢰 배치
  const placeMines = (startRow, startCol, currentBoard) => {
    let placedMines = 0;
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    while (placedMines < level.mines) {
      const r = Math.floor(Math.random() * level.rows);
      const c = Math.floor(Math.random() * level.cols);

      if ((r !== startRow || c !== startCol) && !newBoard[r][c].isMine) {
        newBoard[r][c].isMine = true;
        placedMines++;
      }
    }

    // 각 셀 주변 지뢰 개수 계산
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

  const handleCellClick = (r, c) => {
    if (gameOver || gameWon || board[r][c].isFlagged || board[r][c].isRevealed) return;

    let currentBoard = board;

    if (firstClick) {
      currentBoard = placeMines(r, c, board);
      setFirstClick(false);
    }

    if (currentBoard[r][c].isMine) {
      revealAllMines(currentBoard);
      setGameOver(true);
      return;
    }

    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    revealCell(r, c, newBoard);
    setBoard(newBoard);

    checkWinCondition(newBoard);
  };

  const revealCell = (r, c, b) => {
    if (r < 0 || r >= level.rows || c < 0 || c >= level.cols) return;
    if (b[r][c].isRevealed || b[r][c].isFlagged) return;

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

  const handleContextMenu = (e, r, c) => {
    e.preventDefault();
    if (gameOver || gameWon || board[r][c].isRevealed) return;

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
    }
  };

  return (
    <div className="minesweeper-app">
      <h1 className="title">💣 지뢰찾기</h1>

      {/* 난이도 선택 버튼 */}
      <div className="difficulty-buttons">
        {Object.keys(DIFFICULTY).map((key) => (
          <button
            key={key}
            className={`btn-diff ${level === DIFFICULTY[key] ? 'active' : ''}`}
            onClick={() => setLevel(DIFFICULTY[key])}
          >
            {DIFFICULTY[key].name}
          </button>
        ))}
      </div>

      {/* 상태 메시지 및 재시작 */}
      <div className="status-container">
        {gameOver && <p className="msg fail">💥 지뢰를 밟았습니다! 게임 오버</p>}
        {gameWon && <p className="msg success">🎉 축하합니다! 성공했습니다!</p>}
        <button className="btn-reset" onClick={resetGame}>
          새 게임 시작
        </button>
      </div>

      {/* 보드판 */}
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${level.cols}, 32px)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`cell ${cell.isRevealed ? 'revealed' : ''}`}
              onClick={() => handleCellClick(r, c)}
              onContextMenu={(e) => handleContextMenu(e, r, c)}
              style={{
                color: cell.isRevealed && cell.neighborMines > 0
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
                : cell.isFlagged
                ? '🚩'
                : ''}
            </button>
          ))
        )}
      </div>
    </div>
  );
}