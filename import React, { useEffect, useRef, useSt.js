import React, { useEffect, useRef, useState } from "react";

// Juego tipo Pac‑Man didáctico con Canvas, en React
// NUEVO: Ingresa tu lista de palabras y cómelas en orden secuencial

export default function GrammarPacman() {
  // ===== UI =====
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Cargando pregunta...");
  const [showStart, setShowStart] = useState(true);
  const [customWords, setCustomWords] = useState("");
  const [wordList, setWordList] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [gameMode, setGameMode] = useState("grammar"); // "grammar" o "sequence"

  // ===== Canvas =====
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // ===== Constantes =====
  const TILE = 32;
  const PAC_SPEED = 4;
  const GHOST_SPEED = 2;
  const PILL_SPEED = 1;
  const ANSWER_COLORS = ["#FF4136", "#00FF7F", "#00FFFF"]; // rojo, verde, cian

  const mapRaw = [
    "################",
    "#..#......#...#",
    "#.##.####.##.##",
    "#..............#",
    "#.##.#....#.##.#",
    "#....#..G.#....#",
    "#.##.#....#.##.#",
    "#..............#",
    "#.##.#....#.##.#",
    "#....#....#....#",
    "#.##.####.##.##",
    "#..............#",
    "################",
  ];

  // Normaliza a rectangular
  const COLS = Math.max(...mapRaw.map((r) => r.length));
  const ROWS = mapRaw.length;
  const map = mapRaw.map((r) => (r + "#".repeat(Math.max(0, COLS - r.length))).slice(0, COLS));

  // ===== Estado de juego (mutables) =====
  const stateRef = useRef({
    pac: { x: 1 * TILE, y: (ROWS - 2) * TILE, w: TILE, h: TILE, dx: 0, dy: 0, ndx: 0, ndy: 0, angle: 0 },
    ghost: { x: 8 * TILE, y: 5 * TILE, w: TILE, h: TILE, dx: GHOST_SPEED, dy: 0 },
    answerPellets: [], // {x,y,w,h,color,isCorrect,label,dx,dy,moveCounter}
    pellets: [], // puntos pequeños
    walls: [],
    questions: [],
    currentQ: null,
    targetColor: "",
    frameCount: 0,
  });

  const DEFAULT_LEVELS = [
    { sentence: "Is ___ there?", targetWord: "anyone", options: ["someone", "anyone", "fewer"], correctIndex: 1 },
    { sentence: "Neither of them ___ ready.", targetWord: "is", options: ["are", "is", "be"], correctIndex: 1 },
    { sentence: "There are ___ people here.", targetWord: "fewer", options: ["less", "fewer", "many"], correctIndex: 1 },
    { sentence: "I look forward to ___ you.", targetWord: "meeting", options: ["meet", "meeting", "met"], correctIndex: 1 },
    { sentence: "Between you and ___.", targetWord: "me", options: ["I", "me", "myself"], correctIndex: 1 },
    { sentence: "She ___ to the store.", targetWord: "goes", options: ["go", "goes", "gone"], correctIndex: 1 },
  ];

  // ===== Helpers =====
  function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function tileAt(px, py) {
    const col = Math.floor(px / TILE);
    const row = Math.floor(py / TILE);
    const r = map[row];
    return r && r[col] ? r[col] : "#";
  }

  function wallCollision(x, y) {
    const W = TILE;
    if (x < 0 || y < 0 || x + W > COLS * TILE || y + W > ROWS * TILE) return true;
    const corners = [
      [x, y],
      [x + W - 1, y],
      [x, y + W - 1],
      [x + W - 1, y + W - 1],
    ];
    return corners.some(([cx, cy]) => tileAt(cx, cy) === "#");
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Encuentra posiciones válidas para spawn aleatorio
  function getValidSpawnPositions() {
    const positions = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (map[y][x] === '.' && !wallCollision(x * TILE, y * TILE)) {
          positions.push({ x: x * TILE, y: y * TILE });
        }
      }
    }
    return positions;
  }

  function buildMap() {
    const S = stateRef.current;
    S.walls = [];
    S.pellets = [];
    S.answerPellets = [];
    let ghostPos = null;
    let pacPos = null;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const ch = map[y][x];
        const pos = { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
        if (ch === "#") S.walls.push(pos);
        else if (ch === ".") S.pellets.push({ x: pos.x + TILE / 2, y: pos.y + TILE / 2, r: 4 });
        else if (ch === "G") ghostPos = { x: pos.x, y: pos.y };
      }
    }

    // Crear píldoras de respuesta en posiciones aleatorias válidas
    const validPositions = getValidSpawnPositions();
    const shuffledPositions = shuffle(validPositions);
    
    for (let i = 0; i < 3 && i < shuffledPositions.length; i++) {
      const pos = shuffledPositions[i];
      // Direcciones iniciales aleatorias
      const directions = [
        { dx: PILL_SPEED, dy: 0 },
        { dx: -PILL_SPEED, dy: 0 },
        { dx: 0, dy: PILL_SPEED },
        { dx: 0, dy: -PILL_SPEED }
      ];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      
      S.answerPellets.push({ 
        x: pos.x, 
        y: pos.y, 
        w: TILE, 
        h: TILE,
        dx: dir.dx,
        dy: dir.dy,
        moveCounter: 0,
        changeDirectionAt: 30 + Math.floor(Math.random() * 30)
      });
    }

    if (ghostPos) {
      S.ghost.x = ghostPos.x; 
      S.ghost.y = ghostPos.y;
    }
    
    // Spawn de Pac‑Man
    if (!pacPos) {
      let best = null, bestD = -1;
      for (const p of S.pellets) {
        const dx = (S.ghost.x - (p.x - TILE / 2));
        const dy = (S.ghost.y - (p.y - TILE / 2));
        const d = Math.abs(dx) + Math.abs(dy);
        if (d > bestD) { 
          bestD = d; 
          best = p; 
        }
      }
      if (best) pacPos = { x: best.x - TILE / 2, y: best.y - TILE / 2 };
      else pacPos = { x: 1 * TILE, y: (ROWS - 2) * TILE };
    }
    
    S.pac.x = pacPos.x; 
    S.pac.y = pacPos.y; 
    S.pac.dx = 0; 
    S.pac.dy = 0; 
    S.pac.ndx = 0; 
    S.pac.ndy = 0; 
    S.pac.angle = 0;
  }

  function loadNextQuestion() {
    const S = stateRef.current;
    
    if (gameMode === "sequence") {
      // Modo secuencial con palabras personalizadas
      if (currentWordIndex >= wordList.length) {
        // Has completado todas las palabras
        setMessage(
          <span style={{ color: '#00FF00' }}>
            ¡FELICIDADES! Completaste todas las palabras 🎉
          </span>
        );
        setRunning(false);
        setShowStart(true);
        return;
      }
      
      const targetWord = wordList[currentWordIndex];
      S.targetColor = ANSWER_COLORS[0]; // Color fijo para la palabra correcta
      
      // Crear opciones: la palabra correcta y 2 palabras aleatorias
      let otherWords = wordList.filter((w, i) => i !== currentWordIndex);
      if (otherWords.length < 2) {
        // Si no hay suficientes palabras, usar palabras dummy
        otherWords = [...otherWords, "wrong", "false", "error", "miss"];
      }
      const shuffledOthers = shuffle(otherWords).slice(0, 2);
      const allOptions = shuffle([targetWord, ...shuffledOthers]);
      
      S.answerPellets.forEach((p, i) => {
        p.label = allOptions[i] || "?";
        p.color = p.label === targetWord ? S.targetColor : ANSWER_COLORS[i + 1];
        p.isCorrect = (p.label === targetWord);
      });
      
      setMessage(
        <span>
          Palabra #{currentWordIndex + 1} de {wordList.length}: 
          <span style={{ color: S.targetColor, marginLeft: '10px', textShadow: `0 0 5px ${S.targetColor}` }}>
            {targetWord}
          </span>
        </span>
      );
      
    } else {
      // Modo gramática tradicional
      if (!S.questions.length) S.questions = shuffle(DEFAULT_LEVELS);
      S.currentQ = S.questions.pop();

      const shuffledColors = shuffle(ANSWER_COLORS);
      S.targetColor = shuffledColors[0];

      const shuffledOptions = shuffle(S.currentQ.options);
      const correctIdx = shuffledOptions.indexOf(S.currentQ.targetWord);
      if (correctIdx !== -1 && correctIdx !== 0) {
        [shuffledOptions[0], shuffledOptions[correctIdx]] = [shuffledOptions[correctIdx], shuffledOptions[0]];
      }

      S.answerPellets.forEach((p, i) => {
        p.color = shuffledColors[i];
        p.label = shuffledOptions[i];
        p.isCorrect = (p.color === S.targetColor);
      });

      setMessage(renderQuestionHTML(S.currentQ.sentence, S.currentQ.targetWord, S.targetColor));
    }
  }

  function renderQuestionHTML(sentence, word, color) {
    const parts = sentence.split("___");
    return (
      <span>
        {(parts[0] ?? "")}<span style={{ color, textShadow: `0 0 5px ${color}` }}>{word}</span>{parts[1] ?? ""}
      </span>
    );
  }

  function draw(ctx) {
    const S = stateRef.current;
    ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);

    // Muros
    ctx.fillStyle = "#0033FF";
    for (const w of S.walls) ctx.fillRect(w.x, w.y, w.w, w.h);

    // Puntos
    ctx.fillStyle = "#FFFFFF";
    for (const p of S.pellets) {
      ctx.beginPath(); 
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); 
      ctx.fill();
    }

    // Píldoras respuesta con animación
    for (const p of S.answerPellets) {
      const floatY = Math.sin(S.frameCount * 0.05 + p.x) * 2;
      
      // Sombra
      ctx.beginPath();
      ctx.arc(p.x + TILE / 2, p.y + TILE / 2 + 2, TILE / 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();
      
      // Píldora
      ctx.beginPath(); 
      ctx.arc(p.x + TILE / 2, p.y + TILE / 2 + floatY, TILE / 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color || "#0FF"; 
      ctx.fill();
      
      // Brillo
      ctx.beginPath();
      ctx.arc(p.x + TILE / 2 - 3, p.y + TILE / 2 - 3 + floatY, TILE / 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();
      
      // Texto
      const label = String(p.label || "");
      ctx.fillStyle = "#000"; 
      ctx.font = (label.length > 7 ? 8 : label.length > 5 ? 10 : 12) + "px monospace"; 
      ctx.textAlign = "center"; 
      ctx.textBaseline = "middle";
      if (label) ctx.fillText(label, p.x + TILE / 2, p.y + TILE / 2 + floatY);
    }

    // Fantasma
    const ghostBob = Math.sin(S.frameCount * 0.1) * 2;
    ctx.fillStyle = "#FF69B4";
    ctx.beginPath();
    ctx.arc(S.ghost.x + TILE/2, S.ghost.y + TILE/2 - 3, TILE/2 - 2, Math.PI, 0, false);
    ctx.lineTo(S.ghost.x + TILE - 2, S.ghost.y + TILE - 3 + ghostBob);
    for(let i = 0; i < 4; i++) {
      ctx.lineTo(S.ghost.x + TILE - 6 - i*7, S.ghost.y + TILE - 1 + ghostBob - (i%2)*3);
    }
    ctx.lineTo(S.ghost.x + 2, S.ghost.y + TILE - 3 + ghostBob);
    ctx.closePath();
    ctx.fill();
    
    // Ojos del fantasma
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(S.ghost.x + 10, S.ghost.y + 12, 4, 0, Math.PI * 2);
    ctx.arc(S.ghost.x + 22, S.ghost.y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(S.ghost.x + 10 + Math.sin(S.frameCount * 0.05) * 2, S.ghost.y + 12, 2, 0, Math.PI * 2);
    ctx.arc(S.ghost.x + 22 + Math.sin(S.frameCount * 0.05) * 2, S.ghost.y + 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Pac‑Man
    ctx.save(); 
    ctx.translate(S.pac.x + TILE / 2, S.pac.y + TILE / 2); 
    ctx.rotate(S.pac.angle); 
    ctx.beginPath();
    const mouth = 0.2 * Math.PI * (Math.sin(S.frameCount * 0.2) + 1);
    ctx.arc(0, 0, TILE / 2 - 2, mouth, Math.PI * 2 - mouth); 
    ctx.lineTo(0, 0); 
    ctx.closePath(); 
    ctx.fillStyle = "#FFFF00"; 
    ctx.fill();
    ctx.restore();
  }

  function updatePills() {
    const S = stateRef.current;
    
    for (const pill of S.answerPellets) {
      pill.moveCounter++;
      
      if (pill.x % TILE === 0 && pill.y % TILE === 0) {
        if (pill.moveCounter >= pill.changeDirectionAt || wallCollision(pill.x + pill.dx * TILE, pill.y + pill.dy * TILE)) {
          const dirs = [];
          
          if (!wallCollision(pill.x, pill.y - TILE)) dirs.push({ dx: 0, dy: -PILL_SPEED });
          if (!wallCollision(pill.x, pill.y + TILE)) dirs.push({ dx: 0, dy: PILL_SPEED });
          if (!wallCollision(pill.x - TILE, pill.y)) dirs.push({ dx: -PILL_SPEED, dy: 0 });
          if (!wallCollision(pill.x + TILE, pill.y)) dirs.push({ dx: PILL_SPEED, dy: 0 });
          
          const nonReverse = dirs.filter(d => !(d.dx === -pill.dx && d.dy === -pill.dy));
          const availableDirs = nonReverse.length > 0 ? nonReverse : dirs;
          
          if (availableDirs.length > 0) {
            if (Math.random() < 0.7) {
              const chosen = availableDirs[Math.floor(Math.random() * availableDirs.length)];
              pill.dx = chosen.dx;
              pill.dy = chosen.dy;
            } else {
              availableDirs.sort((a, b) => {
                const distA = Math.abs(S.pac.x - (pill.x + a.dx * TILE)) + Math.abs(S.pac.y - (pill.y + a.dy * TILE));
                const distB = Math.abs(S.pac.x - (pill.x + b.dx * TILE)) + Math.abs(S.pac.y - (pill.y + b.dy * TILE));
                return distB - distA;
              });
              pill.dx = availableDirs[0].dx;
              pill.dy = availableDirs[0].dy;
            }
            
            pill.moveCounter = 0;
            pill.changeDirectionAt = 30 + Math.floor(Math.random() * 60);
          }
        }
      }
      
      if (!wallCollision(pill.x + pill.dx, pill.y + pill.dy)) {
        pill.x += pill.dx;
        pill.y += pill.dy;
      }
    }
  }

  function update() {
    const S = stateRef.current;
    S.frameCount++;

    // Actualizar Pac-Man
    if (S.pac.x % TILE === 0 && S.pac.y % TILE === 0) {
      const tx = S.pac.x + Math.sign(S.pac.ndx) * TILE;
      const ty = S.pac.y + Math.sign(S.pac.ndy) * TILE;
      if (!wallCollision(tx, ty)) {
        S.pac.dx = S.pac.ndx; 
        S.pac.dy = S.pac.ndy;
        S.pac.angle = S.pac.dx > 0 ? 0 : S.pac.dx < 0 ? Math.PI : S.pac.dy > 0 ? 0.5 * Math.PI : -0.5 * Math.PI;
      }
    }
    if (!wallCollision(S.pac.x + S.pac.dx, S.pac.y + S.pac.dy)) {
      S.pac.x += S.pac.dx; 
      S.pac.y += S.pac.dy;
    }

    // Actualizar píldoras móviles
    updatePills();

    // Fantasma
    if (S.ghost.x % TILE === 0 && S.ghost.y % TILE === 0) {
      const dirs = [];
      if (!wallCollision(S.ghost.x, S.ghost.y - TILE)) dirs.push({ dx: 0, dy: -GHOST_SPEED, nx: S.ghost.x, ny: S.ghost.y - TILE });
      if (!wallCollision(S.ghost.x, S.ghost.y + TILE)) dirs.push({ dx: 0, dy: GHOST_SPEED, nx: S.ghost.x, ny: S.ghost.y + TILE });
      if (!wallCollision(S.ghost.x - TILE, S.ghost.y)) dirs.push({ dx: -GHOST_SPEED, dy: 0, nx: S.ghost.x - TILE, ny: S.ghost.y });
      if (!wallCollision(S.ghost.x + TILE, S.ghost.y)) dirs.push({ dx: GHOST_SPEED, dy: 0, nx: S.ghost.x + TILE, ny: S.ghost.y });
      
      dirs.sort((a, b) => 
        Math.abs(S.pac.x - a.nx) + Math.abs(S.pac.y - a.ny) - (Math.abs(S.pac.x - b.nx) + Math.abs(S.pac.y - b.ny))
      );
      
      const nonRev = dirs.filter((d) => d.dx !== -S.ghost.dx || d.dy !== -S.ghost.dy);
      const chosen = nonRev[0] || dirs[0];
      if (chosen) { 
        S.ghost.dx = chosen.dx; 
        S.ghost.dy = chosen.dy; 
      }
    }
    S.ghost.x += S.ghost.dx; 
    S.ghost.y += S.ghost.dy;

    // Colisiones respuestas
    for (const t of S.answerPellets) {
      if (rectsOverlap(S.pac, t)) {
        if (t.isCorrect) {
          setScore((s) => s + 100);
          
          if (gameMode === "sequence") {
            // Avanzar a la siguiente palabra
            setCurrentWordIndex((i) => i + 1);
          }
          
          // Cargar siguiente nivel/palabra
          buildMap();
          loadNextQuestion();
        } else {
          loseLife();
        }
        return;
      }
    }

    // Colisiones con puntos pequeños
    for (let i = S.pellets.length - 1; i >= 0; i--) {
      const p = S.pellets[i];
      const dx = p.x - (S.pac.x + TILE / 2);
      const dy = p.y - (S.pac.y + TILE / 2);
      if (Math.sqrt(dx * dx + dy * dy) < TILE / 2) {
        setScore((s) => s + 10);
        S.pellets.splice(i, 1);
      }
    }

    // Colisión fantasma
    if (rectsOverlap(S.pac, S.ghost)) {
      loseLife();
    }

    function loseLife() {
      setLives((L) => {
        const next = L - 1;
        if (next <= 0) {
          setRunning(false);
          setShowStart(true);
        } else {
          buildMap();
          loadNextQuestion();
        }
        return next;
      });
    }
  }

  // ===== Input =====
  useEffect(() => {
    function keydown(e) {
      if (!running) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      const S = stateRef.current;
      switch (e.key) {
        case "ArrowUp": S.pac.ndx = 0; S.pac.ndy = -PAC_SPEED; break;
        case "ArrowDown": S.pac.ndx = 0; S.pac.ndy = PAC_SPEED; break;
        case "ArrowLeft": S.pac.ndx = -PAC_SPEED; S.pac.ndy = 0; break;
        case "ArrowRight": S.pac.ndx = PAC_SPEED; S.pac.ndy = 0; break;
        default: break;
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [running]);

  // ===== Loop =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;

    // Inicializa mapa y pregunta
    buildMap();
    loadNextQuestion();
    const ctx = canvas.getContext("2d");

    function frame() {
      if (running) {
        update();
      }
      draw(ctx);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, currentWordIndex]);

  function startGame() {
    // Procesar palabras personalizadas
    if (customWords.trim()) {
      const words = customWords
        .split(/[\n,]/)
        .map(w => w.trim())
        .filter(w => w.length > 0);
      
      if (words.length === 0) {
        alert("Por favor ingresa al menos una palabra");
        return;
      }
      
      setWordList(words);
      setCurrentWordIndex(0);
    } else {
      setWordList(DEFAULT_WORDS);
      setCurrentWordIndex(0);
    }
    
    setScore(0); 
    setLives(3); 
    setShowStart(false); 
    setRunning(true);
    stateRef.current.frameCount = 0;
  }

  // ===== Render =====
  return (
    <div className="w-full min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="relative border-4 border-blue-600 shadow-[0_0_20px] shadow-blue-600 rounded-xl bg-zinc-900 p-3">
        <div className="flex items-center justify-between text-sm mb-2 font-mono">
          <div className="text-yellow-300">SCORE: {score}</div>
          <div className="text-red-400">LIVES: {lives}</div>
        </div>
        <div className="mb-3 text-center text-xs bg-zinc-800 border-2 border-yellow-300 rounded px-2 py-2 font-mono min-h-[40px] flex items-center justify-center">
          {message}
        </div>
        <canvas ref={canvasRef} className="block bg-black" />

        {showStart && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 rounded-xl overflow-y-auto">
            <div className="bg-zinc-900 border-4 border-yellow-300 rounded-xl p-6 text-center w-[min(90vw,560px)] max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl text-yellow-300 mb-4 font-mono animate-pulse">PAC‑MAN SECUENCIAL</h2>
              
              <div className="mb-4">
                <label className="text-sm text-zinc-300 block mb-2">
                  Ingresa tus palabras en inglés (una por línea o separadas por comas):
                </label>
                <textarea
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                  placeholder="apple&#10;banana&#10;orange&#10;grape&#10;watermelon"
                  className="w-full h-32 p-2 bg-zinc-800 text-white rounded border border-zinc-600 font-mono text-xs"
                />
                <p className="text-xs text-zinc-400 mt-2">
                  Deberás comer las palabras en orden secuencial. ¡Huye de los fantasmas!
                </p>
              </div>

              <button 
                onClick={startGame} 
                className="px-6 py-3 rounded-lg bg-yellow-300 text-black text-lg font-bold hover:bg-white transition-all transform hover:scale-105 shadow-lg"
              >
                START GAME
              </button>
              <p className="text-xs text-zinc-400 mt-4">🎮 Usa las FLECHAS para moverte</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
