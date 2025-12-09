import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Crown,
  Sword,
  Gem,
  Scroll,
  Utensils,
  Castle,
  HeartPulse,
  LogOut,
  X,
  Trophy,
  RotateCcw,
  User,
  CheckCircle,
  HelpCircle,
  Trash2,
  EyeOff,
  Gift,
  Scale,
  ArrowRight,
  Shield,
  AlertTriangle,
  History,
  BookOpen,
  Eye,
  Check,
  Layers,
  Hammer,
} from "lucide-react";

// --- Firebase Config & Init ---
const firebaseConfig = {
  apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
  authDomain: "game-hub-ff8aa.firebaseapp.com",
  projectId: "game-hub-ff8aa",
  storageBucket: "game-hub-ff8aa.firebasestorage.app",
  messagingSenderId: "586559578902",
  appId: "1:586559578902:web:2c9029761ef876856aa637"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID =
  typeof __app_id !== "undefined" ? __app_id : "emperor-game";
const GAME_ID = "4";

// --- Game Constants ---

// Order maintained: 5, 4, 3, 3, 2, 2, 2
// UPDATED: Backgrounds are now solid (bg-gray-900) to prevent transparency issues in stacked hands.
const KINGS = {
  TREASURE: {
    id: "TREASURE",
    name: "The Merchant",
    val: 5,
    icon: Gem,
    color: "text-yellow-400",
    bg: "bg-gray-900",
    border: "border-yellow-500",
    item: "Treasure",
  },
  WEAPON: {
    id: "WEAPON",
    name: "The Warlord",
    val: 4,
    icon: Sword,
    color: "text-red-500",
    bg: "bg-gray-900",
    border: "border-red-600",
    item: "Weapon",
  },
  ART: {
    id: "ART",
    name: "The Patron",
    val: 3,
    icon: Crown,
    color: "text-purple-400",
    bg: "bg-gray-900",
    border: "border-purple-500",
    item: "Art",
  },
  CLOTH: {
    id: "CLOTH",
    name: "The Weaver",
    val: 3,
    icon: Scroll,
    color: "text-blue-400",
    bg: "bg-gray-900",
    border: "border-blue-500",
    item: "Cloth",
  },
  FOOD: {
    id: "FOOD",
    name: "The Glutton",
    val: 2,
    icon: Utensils,
    color: "text-green-400",
    bg: "bg-gray-900",
    border: "border-green-500",
    item: "Food",
  },
  HOUSING: {
    id: "HOUSING",
    name: "The Architect",
    val: 2,
    icon: Castle,
    color: "text-orange-400",
    bg: "bg-gray-900",
    border: "border-orange-500",
    item: "Housing",
  },
  HEALTH: {
    id: "HEALTH",
    name: "The Healer",
    val: 2,
    icon: HeartPulse,
    color: "text-pink-400",
    bg: "bg-gray-900",
    border: "border-pink-500",
    item: "Treatment",
  },
};

const TOKENS = {
  SECRET: {
    id: "SECRET",
    name: "Secret Plan",
    icon: EyeOff,
    color: "text-blue-400",
    count: 1,
    desc: "Place 1 card face down (revealed at round end).",
    reqCards: 1,
  },
  SABOTAGE: {
    id: "SABOTAGE",
    name: "Sabotage",
    icon: Trash2,
    color: "text-red-400",
    count: 1,
    desc: "Discard 2 cards permanently.",
    reqCards: 2,
  },
  GIFT: {
    id: "GIFT",
    name: "The Offering",
    icon: Gift,
    color: "text-purple-400",
    count: 1,
    desc: "Offer 3 cards. Opponent picks 1, you keep 2.",
    reqCards: 3,
  },
  TRADE: {
    id: "TRADE",
    name: "The Divide",
    icon: Scale,
    color: "text-green-400",
    count: 1,
    desc: "Make two piles (2+2). Opponent picks one pile.",
    reqCards: 4,
  },
};

// --- Helper Functions ---
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// Creates a unique log object to prevent Firestore deduplication issues
const createLog = (text, type = "neutral") => ({
  text,
  type,
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
});

// --- Sub-Components ---

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-80" />
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/black-scales.png")',
      }}
    ></div>
  </div>
);

// ADDED: The Footer Component
const EmperorLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Crown size={12} className="text-yellow-500" />
    <span className="text-[10px] font-black tracking-widest text-yellow-500 uppercase">
      EMPEROR
    </span>
  </div>
);

const LeaveConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abandon Kingdom?</h3>
      <p className="text-gray-400 mb-6 text-sm">
        Are you sure you want to leave? This will remove you from the room.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  </div>
);

const CardDisplay = ({
  typeId,
  onClick,
  selected,
  disabled,
  small,
  tiny,
  faceDown,
  isOpponent,
}) => {
  if (faceDown) {
    return (
      <div
        className={`
        ${
          tiny
            ? "w-6 h-8 rounded-sm"
            : small
            ? "w-10 h-14 rounded"
            : "w-16 h-24 md:w-20 md:h-32 rounded"
        } 
        bg-gray-800 border-2 border-gray-600 flex items-center justify-center shadow-lg transition-transform
        ${isOpponent ? "" : "hover:border-gray-400"}
      `}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 to-gray-900 opacity-50 flex items-center justify-center">
          <span
            className={`${
              tiny ? "text-[10px]" : "text-2xl"
            } text-gray-500 font-bold font-serif`}
          >
            ?
          </span>
        </div>
      </div>
    );
  }

  const king = KINGS[typeId];
  if (!king) return null;

  if (tiny) {
    return (
      <div
        className={`w-6 h-8 ${king.bg} border ${king.border} rounded-sm flex items-center justify-center shadow-sm`}
      >
        <king.icon className={`${king.color} w-3 h-3`} />
      </div>
    );
  }

  // Responsive sizing for main cards
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded border-2 transition-all flex flex-col items-center justify-center shadow-lg
        ${small ? "w-10 h-14 p-1" : "w-16 h-24 md:w-24 md:h-36 p-1 md:p-2"}
        ${
          selected
            ? "ring-4 ring-yellow-400 -translate-y-2 z-10"
            : "border-gray-600"
        }
        ${king.bg}
        ${
          disabled
            ? "cursor-not-allowed brightness-75"
            : "hover:scale-105 cursor-pointer hover:border-white"
        }
      `}
    >
      {/* Top Left Value */}
      <div
        className={`absolute top-0.5 left-1 md:top-1 md:left-1 text-[9px] md:text-[10px] font-bold ${king.color} leading-none`}
      >
        {king.val}
      </div>

      {/* Bottom Right Value */}
      <div
        className={`absolute bottom-0.5 right-1 md:bottom-1 md:right-1 text-[9px] md:text-[10px] font-bold ${king.color} leading-none rotate-180`}
      >
        {king.val}
      </div>

      <king.icon
        className={`${king.color} ${
          small ? "w-4 h-4" : "w-6 h-6 md:w-10 md:h-10"
        }`}
      />
      {!small && (
        <span
          className={`font-bold text-[9px] md:text-xs mt-1 md:mt-2 text-gray-300 text-center leading-none truncate w-full`}
        >
          {king.item}
        </span>
      )}
    </button>
  );
};

const TokenButton = ({ type, used, onClick, active, disabled }) => {
  const token = TOKENS[type];
  return (
    <button
      onClick={onClick}
      disabled={used || disabled}
      className={`
        relative p-2 md:p-3 rounded-full border-2 transition-all flex items-center justify-center group
        ${
          used
            ? "bg-gray-800 border-gray-700 opacity-40 grayscale"
            : "bg-gray-800 border-gray-500 hover:border-white hover:bg-gray-700"
        }
        ${
          active ? "ring-2 md:ring-4 ring-yellow-400 scale-110 bg-gray-700" : ""
        }
      `}
      title={token.desc}
    >
      <token.icon
        size={16}
        className={`${
          used ? "text-gray-500" : token.color
        } w-4 h-4 md:w-5 md:h-5`}
      />
      {/* Tooltip hidden on touch, visible on hover */}
      <div className="absolute bottom-full mb-2 hidden md:group-hover:block w-32 bg-black text-white text-[10px] p-2 rounded z-50 pointer-events-none">
        {token.desc} ({token.reqCards} cards)
      </div>
    </button>
  );
};

const KingCard = ({ id, data, myColor }) => {
  const king = KINGS[id];
  const owner = data.owner;

  const topItems = myColor === "red" ? data.blueItems : data.redItems;
  const bottomItems = myColor === "red" ? data.redItems : data.blueItems;

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      {/* Top Items */}
      <div className="flex flex-wrap justify-center gap-0.5 min-h-[1rem] items-end w-full">
        {topItems.map((item, i) => (
          <CardDisplay key={i} typeId={item} tiny />
        ))}
      </div>

      {/* Main King Card (Playing Card Style) */}
      <div
        className={`
        relative w-full bg-gray-800 rounded-lg md:rounded-xl border-2 md:border-4 transition-all flex flex-col items-center justify-center z-10
        aspect-[2/3] p-1
        ${
          owner === "red"
            ? "border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
            : owner === "blue"
            ? "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            : "border-gray-600"
        }
      `}
      >
        {/* Top Left Value */}
        <div
          className={`absolute top-1 left-1 font-bold text-[10px] md:text-lg ${king.color}`}
        >
          {king.val}
        </div>

        {/* Bottom Right Value */}
        <div
          className={`absolute bottom-1 right-1 font-bold text-[10px] md:text-lg ${king.color} rotate-180`}
        >
          {king.val}
        </div>

        {/* Ownership Token */}
        {owner && (
          <div
            className={`absolute -top-2 -right-2 md:-top-3 md:-right-3 rounded-full p-1 md:p-2 border-2 bg-gray-900 z-20 shadow-lg
            ${
              owner === "red"
                ? "border-red-500 bg-red-900/80 text-red-200"
                : "border-blue-500 bg-blue-900/80 text-blue-200"
            }`}
          >
            <Shield className={"w-3 h-3 md:w-5 md:h-5"} fill="currentColor" />
          </div>
        )}

        {/* Center Content */}
        <king.icon
          className={`${king.color} w-5 h-5 md:w-10 md:h-10 mb-1 md:mb-2`}
        />
        <span
          className={`${king.color} font-serif font-bold text-[8px] md:text-sm text-center leading-tight truncate w-full`}
        >
          {king.name.split(" ").pop()}
        </span>
        <span className="text-gray-500 text-[8px] md:text-[10px] mt-0.5 uppercase tracking-wide hidden md:block">
          {king.item}
        </span>
      </div>

      {/* Bottom Items */}
      <div className="flex gap-0.5 min-h-[2rem] items-start">
        {bottomItems.map((item, i) => (
          <CardDisplay key={i} typeId={item} tiny />
        ))}
      </div>
    </div>
  );
};

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
    <div className="bg-gray-800 w-full max-w-md h-[70vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl animate-in zoom-in-95">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={20} /> Chronicles
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-sm p-3 rounded border-l-2 flex items-center gap-2 ${
              log.type === "danger"
                ? "bg-red-900/20 border-red-500 text-red-200"
                : log.type === "blue"
                ? "bg-blue-900/20 border-blue-500 text-blue-200"
                : log.type === "success"
                ? "bg-green-900/20 border-green-500 text-green-200"
                : "bg-gray-700/30 border-gray-500 text-gray-300"
            }`}
          >
            {/* UPDATED: Show User Icon for player events instead of circle */}
            {(log.type === "danger" || log.type === "blue") && (
              <User size={14} className="shrink-0" />
            )}
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-yellow-700 shadow-2xl flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <div>
          <h2 className="text-2xl font-serif text-yellow-500 uppercase tracking-widest">
            Imperial Decree
          </h2>
          <span className="text-gray-500 text-xs">Rules of Engagement</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-300 scrollbar-thin scrollbar-thumb-gray-700">
        {/* Objective */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
            <Trophy className="text-yellow-500" /> The Goal
          </h3>
          <p>
            Conquer the Seven Kingdoms by having the most items in a kingdom at
            the end of a round.
            <br />
            <br />
            <strong className="text-white">Victory Conditions:</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                Control <span className="text-yellow-400">4 Kingdoms</span>
              </li>
              <li>
                OR amass{" "}
                <span className="text-yellow-400">11 Victory Points</span> (Sum
                of Kingdom Values)
              </li>
            </ul>
          </p>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <Sword className="text-red-500" /> Action Tokens
          </h3>
          <p className="mb-4 text-sm text-gray-400">
            You must use each token exactly once per round.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3">
              <EyeOff className="text-blue-400 shrink-0" />
              <div>
                <strong className="text-white block">
                  Secret Plan (1 Card)
                </strong>
                <span className="text-sm">
                  Place 1 card face down. It is revealed and added to your
                  kingdoms at the end of the round.
                </span>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3">
              <Trash2 className="text-red-400 shrink-0" />
              <div>
                <strong className="text-white block">Sabotage (2 Cards)</strong>
                <span className="text-sm">
                  Discard 2 cards permanently from the game. Use this to deny
                  items to your opponent.
                </span>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3">
              <Gift className="text-purple-400 shrink-0" />
              <div>
                <strong className="text-white block">
                  The Offering (3 Cards)
                </strong>
                <span className="text-sm">
                  Select 3 cards. Your opponent picks 1 to keep. You keep the
                  other 2.
                </span>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3">
              <Scale className="text-green-400 shrink-0" />
              <div>
                <strong className="text-white block">
                  The Divide (4 Cards)
                </strong>
                <span className="text-sm">
                  Split 4 cards into two piles (2+2). Your opponent chooses one
                  pile to keep. You get the other.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-950 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="bg-yellow-700 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-bold"
        >
          Close Guide
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function EmperorGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);

  // Gameplay Local State
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [interactiveMode, setInteractiveMode] = useState(null); // 'GIFT_WAIT', 'TRADE_WAIT', 'TRADE_SPLIT'
  const [splitPile1, setSplitPile1] = useState([]); // For Trade Action UI

  // UI State for Modal
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showSecretReveal, setShowSecretReveal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Auth & Listener
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            setError("You are not in this room.");
            return;
          }
          setGameState(data);
          if (
            data.status === "playing" ||
            data.status === "round_end" ||
            data.status === "finished"
          )
            setView("game");
          else setView("lobby");
        } else {
          setRoomId("");
          setView("menu");
          setError("Room closed.");
        }
      }
    );
    return () => unsub();
  }, [roomId, user]);

  // Host Auto-Start Effect
  useEffect(() => {
    if (
      gameState &&
      (gameState.status === "round_end" || gameState.status === "finished") &&
      gameState.hostId === user?.uid
    ) {
      const allReady =
        Object.keys(gameState.readyForNextRound || {}).length === 2;
      if (allReady) {
        const isNewGame = gameState.status === "finished";
        startRound(!isNewGame);
      }
    }
  }, [gameState, user]);

  // Detect Round End Transition
  const prevStatus = useRef("");
  useEffect(() => {
    if (!gameState) return;
    if (
      prevStatus.current !== "round_end" &&
      prevStatus.current !== "finished" &&
      (gameState.status === "round_end" || gameState.status === "finished")
    ) {
      setShowSecretReveal(true);
      setShowRoundSummary(false); // Ensure Summary doesn't pop up immediately
    }
    prevStatus.current = gameState.status;
  }, [gameState?.status]);

  // ... existing auth useEffect ...

  // --- ADD THIS EFFECT ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data[GAME_ID]?.maintenance) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // --- ADD THIS BLOCK ---
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The Emperor's court is currently closed for renovations.
          </p>
        </div>
      </div>
    );
  }

  // ... existing code: if (view === "menu") { ...

  // --- Actions ---

  const createRoom = async () => {
    if (!playerName) return setError("Name required");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();

    // Initialize Kings
    const initialKings = {};
    Object.values(KINGS).forEach((k) => {
      const { icon, ...serializableKing } = k;
      initialKings[k.id] = {
        ...serializableKing,
        owner: null,
        redItems: [],
        blueItems: [],
      };
    });

    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      {
        roomId: newId,
        hostId: user.uid,
        status: "lobby",
        players: [
          {
            id: user.uid,
            name: playerName,
            color: "red",
            hand: [],
            tokens: {
              SECRET: false,
              SABOTAGE: false,
              GIFT: false,
              TRADE: false,
            },
            faceDownCards: [],
            sabotagedCards: [], // Initialize sabotaged pile
            ready: false,
          },
        ],
        kings: initialKings,
        deck: [],
        round: 1,
        turnPlayerId: null,
        phase: "lobby",
        pendingInteraction: null,
        logs: [],
        winnerId: null,
        roundReveal: null,
        readyForNextRound: {},
        winReason: null,
      }
    );
    setRoomId(newId);
    setRoomCodeInput(newId);
    setView("lobby");
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Room ID and Name required");
    setLoading(true);
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomCodeInput
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      setError("Room not found");
      setLoading(false);
      return;
    }

    const data = snap.data();
    if (data.players.length >= 2) {
      setError("Room full");
      setLoading(false);
      return;
    }

    const newPlayers = [
      ...data.players,
      {
        id: user.uid,
        name: playerName,
        color: "blue",
        hand: [],
        tokens: { SECRET: false, SABOTAGE: false, GIFT: false, TRADE: false },
        faceDownCards: [],
        sabotagedCards: [], // Initialize sabotaged pile
        ready: false,
      },
    ];

    await updateDoc(ref, { players: newPlayers });
    setRoomId(roomCodeInput);
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    try {
      const roomRef = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomId
      );
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data();
        const newPlayers = data.players.filter((p) => p.id !== user.uid);

        if (newPlayers.length === 0) {
          await deleteDoc(roomRef);
        } else {
          let newHostId = data.hostId;
          if (data.hostId === user.uid) {
            newHostId = newPlayers[0].id;
          }
          await updateDoc(roomRef, {
            players: newPlayers,
            hostId: newHostId,
          });
        }
      }
    } catch (e) {
      console.error("Error leaving room:", e);
    }
    setRoomId("");
    setView("menu");
    setGameState(null);
    setShowLeaveConfirm(false);
  };

  const startRound = async (keepKings = false) => {
    if (gameState.hostId !== user.uid) return;

    let deck = [];
    Object.values(KINGS).forEach((k) => {
      for (let i = 0; i < k.val; i++) deck.push(k.id);
    });
    deck = shuffle(deck);
    deck.pop();

    const p1Hand = [];
    const p2Hand = [];
    for (let i = 0; i < 7; i++) {
      if (deck.length) p1Hand.push(deck.pop());
    }
    for (let i = 0; i < 6; i++) {
      if (deck.length) p2Hand.push(deck.pop());
    }

    const newKings = { ...gameState.kings };
    Object.keys(newKings).forEach((k) => {
      newKings[k].redItems = [];
      newKings[k].blueItems = [];
      if (!keepKings) newKings[k].owner = null;
    });

    const newPlayers = gameState.players.map((p) => ({
      ...p,
      hand: p.color === "red" ? p1Hand : p2Hand,
      tokens: { SECRET: false, SABOTAGE: false, GIFT: false, TRADE: false },
      faceDownCards: [],
      sabotagedCards: [], // Reset sabotaged pile
      ready: false,
    }));

    const updateData = {
      status: "playing",
      kings: newKings,
      deck,
      players: newPlayers,
      round: keepKings ? gameState.round + 1 : 1,
      turnPlayerId: gameState.players[0].id,
      phase: "turn",
      pendingInteraction: null,
      winnerId: null,
      winReason: null,
      roundReveal: null,
      readyForNextRound: {},
    };

    if (keepKings) {
      updateData.logs = arrayUnion(
        createLog(
          `⚔️ Round ${gameState.round + 1} Begins! Red starts with 7 cards.`,
          "info"
        )
      );
    } else {
      updateData.logs = [
        createLog(
          `⚔️ New Game Started! Round 1 Begins. Red starts with 7 cards.`,
          "info"
        ),
      ];
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updateData
    );
    setShowSecretReveal(false);
    setShowRoundSummary(false);
  };

  const toggleReady = async () => {
    if (!gameState) return;
    const isReady = gameState.readyForNextRound?.[user.uid];

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        [`readyForNextRound.${user.uid}`]: !isReady,
      }
    );
  };

  // --- Gameplay Logic ---

  const endTurn = async (
    newPlayers,
    newKings,
    newDeck,
    logMsg,
    nextPhase = "turn",
    interaction = null
  ) => {
    const allTokensUsed = newPlayers.every((p) =>
      Object.values(p.tokens).every((t) => t === true)
    );

    if (allTokensUsed && !interaction) {
      await performRoundEnd(newPlayers, newKings);
      return;
    }

    let nextPlayerId = gameState.players.find((p) => p.id !== user.uid).id;

    if (interaction) {
      nextPlayerId = interaction.targetId;
    } else {
      if (newDeck.length > 0) {
        const drawn = newDeck.pop();
        const nextPlayerIdx = newPlayers.findIndex(
          (p) => p.id === nextPlayerId
        );
        newPlayers[nextPlayerIdx].hand.push(drawn);
      }
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: newPlayers,
        kings: newKings || gameState.kings,
        deck: newDeck || gameState.deck,
        turnPlayerId: nextPlayerId,
        phase: nextPhase,
        pendingInteraction: interaction,
        logs: arrayUnion(createLog(logMsg, "neutral")),
      }
    );

    setSelectedToken(null);
    setSelectedCards([]);
    setSplitPile1([]);
    setInteractiveMode(null);
  };

  const handleCardClick = (card, idx) => {
    if (selectedCards.includes(idx)) {
      setSelectedCards(selectedCards.filter((i) => i !== idx));
    } else {
      if (selectedToken) {
        const limit = TOKENS[selectedToken].reqCards;
        if (selectedCards.length < limit) {
          setSelectedCards([...selectedCards, idx]);
        }
      }
    }
  };

  const distributeItems = (kingsObj, cardId, playerColor) => {
    const k = kingsObj[cardId];
    if (playerColor === "red") k.redItems.push(cardId);
    else k.blueItems.push(cardId);
  };

  const submitAction = async () => {
    if (!selectedToken || !user) return;
    const me = gameState.players.find((p) => p.id === user.uid);
    const req = TOKENS[selectedToken].reqCards;

    if (selectedCards.length !== req) {
      alert(`Select exactly ${req} cards.`);
      return;
    }

    let newPlayers = JSON.parse(JSON.stringify(gameState.players));
    let meIdx = newPlayers.findIndex((p) => p.id === user.uid);
    let opponentIdx = newPlayers.findIndex((p) => p.id !== user.uid);
    let newKings = JSON.parse(JSON.stringify(gameState.kings));
    let newDeck = [...gameState.deck];

    // FIX: Reconstruct the sorted view the user clicked on to get the correct Card IDs
    const handView = [...me.hand].sort((a, b) => KINGS[b].val - KINGS[a].val);
    const cardsToPlay = selectedCards.map((idx) => handView[idx]);

    // Helper to remove specific items from the real (unsorted) hand
    const removeCardsFromHand = (cardsToRemove) => {
      cardsToRemove.forEach((cardType) => {
        const idx = newPlayers[meIdx].hand.indexOf(cardType);
        if (idx > -1) {
          newPlayers[meIdx].hand.splice(idx, 1);
        }
      });
    };

    newPlayers[meIdx].tokens[selectedToken] = true;

    if (selectedToken === "SECRET") {
      removeCardsFromHand(cardsToPlay);
      newPlayers[meIdx].faceDownCards.push(cardsToPlay[0]);
      await endTurn(
        newPlayers,
        newKings,
        newDeck,
        `${me.name} placed a Secret Plan.`
      );
    } else if (selectedToken === "SABOTAGE") {
      removeCardsFromHand(cardsToPlay);
      if (!newPlayers[meIdx].sabotagedCards)
        newPlayers[meIdx].sabotagedCards = [];
      newPlayers[meIdx].sabotagedCards.push(...cardsToPlay);
      await endTurn(
        newPlayers,
        newKings,
        newDeck,
        `${me.name} Sabotaged (Discarded 2 cards).`
      );
    } else if (selectedToken === "GIFT") {
      removeCardsFromHand(cardsToPlay);
      const interaction = {
        type: "GIFT",
        initiatorId: user.uid,
        targetId: newPlayers[opponentIdx].id,
        cards: cardsToPlay,
      };
      await endTurn(
        newPlayers,
        newKings,
        newDeck,
        `${me.name} offers a Gift (Choose 1 of 3).`,
        "interaction",
        interaction
      );
    } else if (selectedToken === "TRADE") {
      if (interactiveMode !== "TRADE_SPLIT") {
        setInteractiveMode("TRADE_SPLIT");
        return;
      }

      const pile1Indices = splitPile1;

      if (pile1Indices.length !== 2) {
        alert("Piles must be 2 and 2.");
        return;
      }

      // Resolve piles using the sorted handView
      const p1Cards = pile1Indices.map((hIdx) => handView[hIdx]);

      const pile2Indices = selectedCards.filter(
        (hIdx) => !pile1Indices.includes(hIdx)
      );
      const p2Cards = pile2Indices.map((hIdx) => handView[hIdx]);

      removeCardsFromHand(cardsToPlay);

      const interaction = {
        type: "TRADE",
        initiatorId: user.uid,
        targetId: newPlayers[opponentIdx].id,
        pile1: p1Cards,
        pile2: p2Cards,
      };
      await endTurn(
        newPlayers,
        newKings,
        newDeck,
        `${me.name} proposes a Trade (Pick a pile).`,
        "interaction",
        interaction
      );
    }
  };

  const resolveInteraction = async (choice) => {
    if (!gameState.pendingInteraction) return;
    const { type, initiatorId, targetId, cards, pile1, pile2 } =
      gameState.pendingInteraction;

    if (user.uid !== targetId) return;

    let newPlayers = JSON.parse(JSON.stringify(gameState.players));
    let newKings = JSON.parse(JSON.stringify(gameState.kings));
    let newDeck = [...gameState.deck];
    const target = newPlayers.find((p) => p.id === targetId);
    const initiator = newPlayers.find((p) => p.id === initiatorId);
    let logMsg = "";

    if (type === "GIFT") {
      const chosenCard = cards[choice];
      const keptCards = cards.filter((_, i) => i !== choice);

      distributeItems(newKings, chosenCard, target.color);
      keptCards.forEach((c) => distributeItems(newKings, c, initiator.color));

      logMsg = `${target.name} chose ${KINGS[chosenCard].item}. ${initiator.name} kept the rest.`;
    } else if (type === "TRADE") {
      const chosenPile = choice === 0 ? pile1 : pile2;
      const otherPile = choice === 0 ? pile2 : pile1;

      chosenPile.forEach((c) => distributeItems(newKings, c, target.color));
      otherPile.forEach((c) => distributeItems(newKings, c, initiator.color));

      logMsg = `${target.name} picked a pile of ${chosenPile.length} items.`;
    }

    const turnOwner = initiatorId;
    let nextTurnPlayerId = newPlayers.find((p) => p.id !== turnOwner).id;

    const allTokensUsed = newPlayers.every((p) =>
      Object.values(p.tokens).every((t) => t === true)
    );

    if (allTokensUsed) {
      await performRoundEnd(newPlayers, newKings);
    } else {
      if (newDeck.length > 0) {
        const drawn = newDeck.pop();
        const nextPlayerIdx = newPlayers.findIndex(
          (p) => p.id === nextTurnPlayerId
        );
        newPlayers[nextPlayerIdx].hand.push(drawn);
      }

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: newPlayers,
          kings: newKings,
          deck: newDeck,
          pendingInteraction: null,
          phase: "turn",
          turnPlayerId: nextTurnPlayerId,
          logs: arrayUnion(createLog(logMsg, "success")),
        }
      );
    }
  };

  // UPDATED: Logic to use real player names and remove emojis
  const performRoundEnd = async (players, kings) => {
    let logs = [];
    logs.push(createLog("🔔 Round End! Revealing Secret Plans...", "neutral"));

    // 1. Capture Secrets for Display
    const roundReveal = {};
    players.forEach((p) => {
      roundReveal[p.id] = [...p.faceDownCards];
      // Distribute
      p.faceDownCards.forEach((c) => {
        distributeItems(kings, c, p.color);
      });
      p.faceDownCards = [];
    });

    // 2. Calculate Control
    let redKingdoms = 0;
    let blueKingdoms = 0;
    let redScore = 0;
    let blueScore = 0;

    // --- NEW: Identify Players by Color to get Names ---
    const redPlayer = players.find((p) => p.color === "red");
    const bluePlayer = players.find((p) => p.color === "blue");

    Object.keys(kings).forEach((kId) => {
      const k = kings[kId];
      const redCount = k.redItems.length;
      const blueCount = k.blueItems.length;

      if (redCount > blueCount) {
        if (k.owner !== "red")
          // Uses real name and removes the emoji from the text
          logs.push(
            createLog(`${redPlayer.name} conquered ${k.name}!`, "danger")
          );
        k.owner = "red";
      } else if (blueCount > redCount) {
        if (k.owner !== "blue")
          // Uses real name and removes the emoji from the text
          logs.push(
            createLog(`${bluePlayer.name} conquered ${k.name}!`, "blue")
          );
        k.owner = "blue";
      }

      if (k.owner === "red") {
        redKingdoms++;
        redScore += k.val;
      }
      if (k.owner === "blue") {
        blueKingdoms++;
        blueScore += k.val;
      }
    });

    // 3. Check Win Condition
    let winnerId = null;
    let winReason = null;

    if (redKingdoms >= 4 || redScore >= 11) {
      winnerId = redPlayer.id;
      winReason =
        redKingdoms >= 4 ? "controlled 4 Kingdoms" : "scored 11 Victory Points";
    } else if (blueKingdoms >= 4 || blueScore >= 11) {
      winnerId = bluePlayer.id;
      winReason =
        blueKingdoms >= 4
          ? "controlled 4 Kingdoms"
          : "scored 11 Victory Points";
    }

    if (winnerId) {
      logs.push(createLog(`🏆 Game Over!`, "success"));
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: winnerId ? "finished" : "round_end",
        winnerId: winnerId,
        winReason: winReason,
        kings,
        players,
        roundReveal,
        pendingInteraction: null,
        phase: "resolution",
        readyForNextRound: {},
        logs: arrayUnion(...logs),
      }
    );

    // We do NOT show summary here automatically anymore.
    // Workflow: Secrets revealed -> User Inspects -> User clicks "Show Results" or "Next"
  };

  // --- UI Renders ---

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}

        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Crown
            size={64}
            className="text-yellow-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 font-serif tracking-widest drop-shadow-md">
            EMPEROR
          </h1>
          <p className="text-gray-400 tracking-[0.3em] uppercase mt-2">
            Rule the Seven Kingdoms
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded mb-4 text-white placeholder-gray-500 focus:border-yellow-500 outline-none transition-colors"
            placeholder="Your Name, My Liege"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
          >
            <Crown size={20} /> Establish Kingdom
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-yellow-500 outline-none"
              placeholder="ROOM CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> How to Play
          </button>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-gray-800/90 p-8 rounded-2xl border border-gray-700 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <h2 className="text-2xl font-serif text-yellow-500">
              Throne Room: {roomId}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User size={16} /> {gameState.players.length}/2
              </div>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 bg-red-900/50 hover:bg-red-900 rounded text-red-300"
                title="Leave Room"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-900 p-4 rounded border border-gray-700"
              >
                <span
                  className={`font-bold ${
                    p.color === "red" ? "text-red-500" : "text-blue-500"
                  } flex items-center gap-2`}
                >
                  {p.id === gameState.hostId && (
                    <Crown size={14} className="text-yellow-500" />
                  )}{" "}
                  {p.name}
                </span>
                {p.id === user.uid && (
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
            ))}
            {gameState.players.length < 2 && (
              <div className="text-center text-gray-500 animate-pulse italic">
                Waiting for challenger...
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {gameState.hostId === user.uid ? (
              <button
                onClick={() => startRound(false)}
                disabled={gameState.players.length < 2}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                  gameState.players.length < 2
                    ? "bg-gray-700 cursor-not-allowed text-gray-500"
                    : "bg-green-700 hover:bg-green-600 text-white shadow-green-900/30"
                }`}
              >
                Begin Campaign
              </button>
            ) : (
              <div className="text-center text-yellow-500/80 font-serif mb-2">
                Waiting for Host to start...
              </div>
            )}
            <button
              onClick={() => setShowGuide(true)}
              className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2"
            >
              <BookOpen size={16} /> Game Rules
            </button>
          </div>
        </div>

        {/* ADDED: Emperor Logo Footer */}
        <EmperorLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    const opponent = gameState.players.find((p) => p.id !== user.uid);

    if (!opponent) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <FloatingBackground />
          <div className="bg-gray-800 p-8 rounded-xl border border-red-700 shadow-2xl relative z-10 max-w-md">
            <AlertTriangle size={64} className="text-red-500 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">
              Opponent has fled the battlefield!
            </h2>
            <p className="text-gray-400 mb-6">
              The empire is yours by default, though it is a hollow victory.
            </p>
            <button
              onClick={() => {
                setRoomId("");
                setGameState(null);
                setView("menu");
              }}
              className="bg-yellow-600 hover:bg-yellow-500 text-black px-6 py-3 rounded font-bold w-full"
            >
              Return to Menu
            </button>
          </div>
        </div>
      );
    }

    const isMyTurn =
      gameState.turnPlayerId === user.uid && gameState.phase === "turn";
    const isInteracting =
      gameState.phase === "interaction" &&
      gameState.pendingInteraction?.targetId === user.uid &&
      gameState.status === "playing";
    const isRoundEnd =
      gameState.status === "round_end" || gameState.status === "finished";

    const myHand = [...me.hand].sort((a, b) => KINGS[b].val - KINGS[a].val);

    const toggleSplit = (idxInSortedHand) => {
      if (splitPile1.includes(idxInSortedHand)) {
        setSplitPile1(splitPile1.filter((i) => i !== idxInSortedHand));
      } else {
        if (splitPile1.length < 2)
          setSplitPile1([...splitPile1, idxInSortedHand]);
      }
    };

    const isReady = gameState.readyForNextRound?.[user.uid];
    const opponentReady = gameState.readyForNextRound?.[opponent.id];

    // ADDED: Prompt logic for when interaction is required
    const showPrompt = isInteracting || (isMyTurn && !isRoundEnd);
    let promptText = "";
    if (isInteracting) {
      if (gameState.pendingInteraction.type === "GIFT")
        promptText = "Gift Received: Pick 1 Card";
      if (gameState.pendingInteraction.type === "TRADE")
        promptText = "Trade Offered: Pick 1 Pile";
    } else if (isMyTurn && !isRoundEnd) {
      if (selectedToken) {
        const t = TOKENS[selectedToken];
        if (selectedToken === "TRADE" && interactiveMode === "TRADE_SPLIT")
          promptText = "Split your cards into two piles";
        else
          promptText = `${t.name}: Select ${t.reqCards} card${
            t.reqCards > 1 ? "s" : ""
          }`;
      } else {
        promptText = "Your Turn: Select an Action Token";
      }
    }

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden relative font-sans select-none">
        <FloatingBackground />

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}

        {/* --- Top Bar --- */}
        <div className="h-14 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-4 z-20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="font-serif text-yellow-500 font-bold tracking-wider hidden md:block">
              EMPEROR
            </div>
            <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              Round {gameState.round}
            </div>
          </div>
          <div className="flex gap-2">
            {/* Show Results / Next Round Action Button in Top Bar */}
            {isRoundEnd &&
              (gameState.winnerId ? (
                <button
                  onClick={() => setShowRoundSummary(true)}
                  className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-bold animate-pulse shadow-lg shadow-yellow-900/50 flex items-center gap-2"
                >
                  <Trophy size={16} /> Show Results
                </button>
              ) : (
                <button
                  onClick={toggleReady}
                  className={`px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all ${
                    isReady
                      ? "bg-green-700 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {isReady ? <Check size={16} /> : <RotateCcw size={16} />}
                  {isReady
                    ? opponentReady
                      ? "Starting..."
                      : "Waiting..."
                    : "Next Round"}
                </button>
              ))}

            <button
              onClick={() => setShowLogs(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* --- Game Area --- */}
        <div className="flex-1 flex flex-col justify-between p-2 md:p-4 relative z-10 max-w-6xl mx-auto w-full h-full">
          {/* Top Section: Opponent Zone + Interaction Panel */}
          <div className="flex flex-row justify-between items-start mb-2 shrink-0 gap-2 h-24 md:h-auto">
            <div className="flex flex-col gap-1 w-[45%] md:w-[40%]">
              <div
                className={`flex items-center gap-2 font-bold ${
                  opponent.color === "red" ? "text-red-500" : "text-blue-500"
                } text-sm md:text-base truncate`}
              >
                <User size={16} /> {opponent.name}
                {gameState.turnPlayerId === opponent.id &&
                  !isInteracting &&
                  !isRoundEnd && (
                    <span className="text-[10px] md:text-xs bg-yellow-500 text-black px-1 rounded animate-pulse ml-2">
                      Thinking...
                    </span>
                  )}
                {gameState.phase === "interaction" &&
                  gameState.pendingInteraction.targetId === opponent.id && (
                    <span className="text-[10px] md:text-xs bg-orange-500 text-white px-1 rounded animate-bounce ml-2">
                      Deciding...
                    </span>
                  )}
              </div>
              <div className="flex gap-1 overflow-hidden">
                {opponent.hand.map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-6 md:w-5 md:h-8 bg-gray-800 border border-gray-600 rounded"
                  />
                ))}
              </div>
              <div className="flex gap-1 mt-1 opacity-70">
                {Object.keys(TOKENS).map((t) => {
                  const TokenIcon = TOKENS[t].icon;
                  const isUsed = opponent.tokens[t];
                  return (
                    <div
                      key={t}
                      className={`p-1 rounded-full border ${
                        isUsed
                          ? "border-gray-700 bg-gray-800"
                          : "border-gray-600 bg-gray-900"
                      }`}
                    >
                      <TokenIcon
                        size={10}
                        className={isUsed ? "text-gray-600" : TOKENS[t].color}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Opponent Secret & Discarded - Combined Row */}
              <div className="flex gap-2 mt-1 items-center overflow-x-auto no-scrollbar">
                {opponent.faceDownCards.length > 0 && (
                  <div className="flex gap-1 items-center bg-black/20 p-1 rounded border-l border-gray-700 pl-2">
                    <span className="text-[9px] text-gray-500 uppercase mr-1 whitespace-nowrap">
                      <EyeOff size={10} />
                    </span>
                    {opponent.faceDownCards.map((_, i) => (
                      <CardDisplay key={`secret-${i}`} tiny faceDown />
                    ))}
                  </div>
                )}
                {opponent.sabotagedCards &&
                  opponent.sabotagedCards.length > 0 && (
                    <div className="flex gap-1 items-center bg-black/20 p-1 rounded border-l border-gray-700 pl-2">
                      <span className="text-[9px] text-gray-500 uppercase mr-1 whitespace-nowrap">
                        <Trash2 size={10} />
                      </span>
                      {opponent.sabotagedCards.map((c, i) => (
                        <CardDisplay key={`discard-${i}`} typeId={c} tiny />
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="flex-1 flex justify-end h-full">
              {isInteracting ? (
                <div className="bg-gray-800/90 border border-orange-500 rounded-lg p-2 shadow-lg flex flex-col items-center justify-center w-full max-w-sm animate-in slide-in-from-right-4 fade-in h-full overflow-y-auto no-scrollbar">
                  {gameState.pendingInteraction.type === "GIFT" && (
                    <>
                      <div className="text-[10px] md:text-xs font-bold text-white flex items-center gap-1 mb-1">
                        <Gift size={12} /> Gift! Keep 1:
                      </div>
                      <div className="flex justify-center gap-2">
                        {gameState.pendingInteraction.cards.map((c, i) => (
                          <div
                            key={i}
                            className="hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => resolveInteraction(i)}
                          >
                            <CardDisplay typeId={c} small />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {gameState.pendingInteraction.type === "TRADE" && (
                    <>
                      <div className="text-[10px] md:text-xs font-bold text-white flex items-center gap-1 mb-1">
                        <Scale size={12} /> Trade! Pick Pile:
                      </div>
                      <div className="flex justify-center gap-2 items-center">
                        <button
                          onClick={() => resolveInteraction(0)}
                          className="bg-gray-700 p-1 rounded border border-gray-600 hover:border-yellow-400 flex gap-1 items-center"
                        >
                          {gameState.pendingInteraction.pile1.map((c, i) => (
                            <CardDisplay key={i} typeId={c} tiny />
                          ))}
                        </button>
                        <span className="text-gray-500 text-[10px]">OR</span>
                        <button
                          onClick={() => resolveInteraction(1)}
                          className="bg-gray-700 p-1 rounded border border-gray-600 hover:border-yellow-400 flex gap-1 items-center"
                        >
                          {gameState.pendingInteraction.pile2.map((c, i) => (
                            <CardDisplay key={i} typeId={c} tiny />
                          ))}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-full"></div>
              )}
            </div>
          </div>

          <div className="flex justify-center mb-2 shrink-0">
            <div className="bg-gray-800 border border-gray-600 px-4 py-1 rounded-full text-xs font-mono text-gray-400 shadow-lg flex items-center gap-2">
              <Layers size={14} /> Deck: {gameState.deck.length}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-0">
            <div
              className={`
                w-full justify-items-center gap-1 md:gap-3
                grid grid-cols-4 md:grid-cols-7
            `}
            >
              {Object.keys(KINGS).map((kId, index) => {
                return (
                  <div
                    key={kId}
                    className={`w-full ${index >= 4 ? "md:col-auto" : ""}`}
                  >
                    <KingCard
                      id={kId}
                      data={gameState.kings[kId]}
                      myColor={me.color}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-8 flex items-center justify-center my-2 shrink-0 relative">
            {!isInteracting && (
              <div className="w-full max-w-md text-center text-sm text-gray-400 bg-gray-900/50 p-1 rounded backdrop-blur-sm flex justify-center items-center gap-2">
                {gameState.logs.slice(-1).map((l, i) => (
                  <span
                    key={i}
                    className={`flex items-center gap-2 ${
                      l.type === "danger"
                        ? "text-red-400"
                        : l.type === "blue"
                        ? "text-blue-400"
                        : l.type === "success"
                        ? "text-green-400"
                        : "text-gray-300"
                    }`}
                  >
                    {/* Show User Icon for player events here too */}
                    {(l.type === "danger" || l.type === "blue") && (
                      <User size={14} />
                    )}
                    {l.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PROMPT BANNER - Bounces above hand */}
          {showPrompt && (
            <div className="flex justify-center mb-1 animate-bounce">
              <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-yellow-300 flex items-center gap-2">
                <AlertTriangle size={12} /> {promptText}
              </div>
            </div>
          )}

          <div
            className={`bg-gray-900/90 p-3 md:p-4 rounded-t-xl md:rounded-xl border-t-2 border-gray-700 transition-all shrink-0 ${
              isMyTurn
                ? "shadow-[0_0_20px_rgba(234,179,8,0.1)] border-yellow-600/50"
                : "grayscale opacity-80"
            }`}
          >
            <div className="flex justify-between items-center mb-2 -mt-1">
              <div
                className={`flex items-center gap-2 font-bold ${
                  me.color === "red" ? "text-red-500" : "text-blue-500"
                } text-sm md:text-base`}
              >
                <User size={16} /> {me.name}
              </div>

              {isMyTurn && !isRoundEnd && (
                <span className="bg-green-600 text-white text-[10px] md:text-xs font-bold px-3 py-0.5 rounded-full shadow-lg animate-bounce border border-green-400 tracking-wider">
                  YOUR TURN
                </span>
              )}
            </div>

            {interactiveMode === "TRADE_SPLIT" ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4 p-4 bg-black/40 rounded-xl">
                  {selectedCards.map((handIdx, i) => {
                    const cardId = myHand[handIdx];
                    const inPile1 = splitPile1.includes(handIdx);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <CardDisplay
                          typeId={cardId}
                          onClick={() => toggleSplit(handIdx)}
                          selected={inPile1}
                        />
                        <div
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            inPile1 ? "bg-blue-600" : "bg-red-600"
                          }`}
                        >
                          {inPile1 ? "Pile 1" : "Pile 2"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setInteractiveMode(null);
                      setSelectedCards([]);
                      setSelectedToken(null);
                    }}
                    className="px-6 py-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAction}
                    disabled={splitPile1.length !== 2}
                    className="px-6 py-2 bg-yellow-600 rounded font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Trade Split
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Main Hand */}
                  <div className="flex-1 flex justify-center px-2 w-full">
                    <div className="flex items-end -space-x-5 md:-space-x-10 hover:-space-x-3 transition-all duration-300 py-4">
                      {myHand.map((c, i) => (
                        <div
                          key={i}
                          className={`
                            shrink-0 relative transition-all duration-200
                            ${
                              selectedCards.includes(i)
                                ? "z-20 -translate-y-4"
                                : "hover:z-10 hover:-translate-y-2"
                            }
                          `}
                        >
                          <CardDisplay
                            typeId={c}
                            onClick={() => isMyTurn && handleCardClick(c, i)}
                            selected={selectedCards.includes(i)}
                            disabled={!isMyTurn}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Secret & Discarded Area (Right Side) - Updated to single row */}
                  <div className="flex gap-2 items-center shrink-0 min-w-[80px] overflow-x-auto no-scrollbar">
                    {me.faceDownCards.length > 0 && (
                      <div className="flex gap-1 items-center bg-black/20 p-1 rounded border-l border-gray-700 pl-2 shrink-0">
                        <span className="text-[9px] text-gray-500 uppercase mr-1 whitespace-nowrap">
                          <EyeOff size={10} />
                        </span>
                        {me.faceDownCards.map((c, i) => (
                          <div
                            key={`my-secret-${i}`}
                            className="opacity-80 hover:opacity-100 transition-opacity shrink-0"
                          >
                            <CardDisplay key={i} typeId={c} tiny />
                          </div>
                        ))}
                      </div>
                    )}

                    {me.sabotagedCards && me.sabotagedCards.length > 0 && (
                      <div className="flex gap-1 items-center bg-black/20 p-1 rounded border-l border-gray-700 pl-2 shrink-0">
                        <Trash2 size={10} className="text-gray-500" />
                        {me.sabotagedCards.map((c, i) => (
                          <CardDisplay
                            key={`my-discard-${i}`}
                            typeId={c}
                            tiny
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2 min-w-[200px] shrink-0 w-full md:w-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {Object.keys(TOKENS).map((key) => (
                        <TokenButton
                          key={key}
                          type={key}
                          used={me.tokens[key]}
                          active={selectedToken === key}
                          disabled={!isMyTurn}
                          onClick={() => {
                            if (isMyTurn && !me.tokens[key]) {
                              setSelectedToken(key);
                              setSelectedCards([]); // Reset selection on token switch
                            }
                          }}
                        />
                      ))}
                    </div>

                    {selectedToken && isMyTurn && (
                      <div className="bg-black/40 p-2 rounded text-xs text-center animate-in slide-in-from-right-4 fade-in">
                        <div className="text-yellow-500 font-bold mb-1">
                          {TOKENS[selectedToken].name}
                        </div>
                        <div className="text-gray-400 mb-2">
                          {TOKENS[selectedToken].desc}
                        </div>
                        <button
                          onClick={submitAction}
                          disabled={
                            selectedCards.length !==
                            TOKENS[selectedToken].reqCards
                          }
                          className="w-full bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded font-bold transition-colors"
                        >
                          Execute ({selectedCards.length}/
                          {TOKENS[selectedToken].reqCards})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Secret Reveal Modal (Step 1 of End Flow) --- */}
        {isRoundEnd && showSecretReveal && gameState.roundReveal && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-purple-500 rounded-2xl p-8 max-w-2xl w-full text-center shadow-2xl animate-in zoom-in-90">
              <h2 className="text-2xl font-serif text-purple-400 mb-6 flex items-center justify-center gap-2">
                <EyeOff /> Secret Plans Revealed!
              </h2>

              <div className="flex flex-col md:flex-row justify-around gap-8 mb-8">
                {Object.keys(gameState.roundReveal).map((pid) => {
                  const pName = gameState.players.find(
                    (p) => p.id === pid
                  )?.name;
                  const cards = gameState.roundReveal[pid];
                  return (
                    <div key={pid} className="flex flex-col items-center gap-2">
                      <div className="font-bold text-gray-300 mb-2">
                        {pName} revealed:
                      </div>
                      <div className="flex gap-2">
                        {cards.length > 0 ? (
                          cards.map((c, i) => (
                            <CardDisplay key={i} typeId={c} small />
                          ))
                        ) : (
                          <div className="text-gray-600 italic">No plans</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowSecretReveal(false)}
                className="px-8 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 mx-auto"
              >
                <Eye size={20} /> Inspect Battlefield
              </button>
            </div>
          </div>
        )}

        {/* --- Game Result / Round Summary Modal (Step 2 of End Flow - Manual Trigger Only) --- */}
        {isRoundEnd && showRoundSummary && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div
              className={`bg-gray-900 border rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] ${
                gameState.winnerId
                  ? "border-yellow-500 shadow-yellow-500/20"
                  : "border-gray-600"
              }`}
            >
              {gameState.winnerId ? (
                <>
                  <Trophy
                    size={64}
                    className="text-yellow-500 mx-auto mb-4 animate-bounce"
                  />
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Kingdoms United!
                  </h2>
                  <p className="text-xl text-gray-300 mb-2">
                    {
                      gameState.players.find((p) => p.id === gameState.winnerId)
                        .name
                    }{" "}
                    is the new Emperor!
                  </p>
                  <p className="text-sm text-yellow-500/80 mb-8 uppercase tracking-widest border-t border-b border-yellow-900/50 py-2">
                    {gameState.winReason}
                  </p>
                </>
              ) : (
                <>
                  <Sword size={64} className="text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Round {gameState.round} Complete
                  </h2>
                  <div className="grid grid-cols-2 gap-4 my-6 text-left bg-black/30 p-4 rounded">
                    <div className="text-red-500 font-bold text-center">
                      <div className="text-2xl">
                        {
                          Object.values(gameState.kings).filter(
                            (k) => k.owner === "red"
                          ).length
                        }
                      </div>
                      <div className="text-xs uppercase text-gray-500">
                        Red Kingdoms
                      </div>
                    </div>
                    <div className="text-blue-500 font-bold text-center">
                      <div className="text-2xl">
                        {
                          Object.values(gameState.kings).filter(
                            (k) => k.owner === "blue"
                          ).length
                        }
                      </div>
                      <div className="text-xs uppercase text-gray-500">
                        Blue Kingdoms
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3">
                {gameState.winnerId ? (
                  <>
                    <button
                      onClick={toggleReady}
                      className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                        isReady
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {isReady ? <Check size={20} /> : <RotateCcw size={20} />}
                      {isReady
                        ? opponentReady
                          ? "Starting New Game..."
                          : "Waiting for Opponent"
                        : "Ready for Rematch"}
                    </button>
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      className="w-full bg-transparent border border-red-900 text-red-400 hover:bg-red-900/20 px-8 py-3 rounded-lg font-bold"
                    >
                      Exit Room
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowRoundSummary(false)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold"
                  >
                    Close & Prepare
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADDED: Emperor Logo Footer */}
        <div className="bg-gray-950 pb-1 pt-1 z-50">
          <EmperorLogo />
        </div>
      </div>
    );
  }

  return null;
}
