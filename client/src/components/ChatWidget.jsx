/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { IoChatbubbleEllipses, IoClose, IoSend } from "react-icons/io5";
import { serverUrl } from "../../config";

const STORAGE_KEY = "orebi_chat_messages";

const renderInline = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// eslint-disable-next-line react/prop-types
const BotBubble = ({ content, products }) => (
  <div className="max-w-[88%] space-y-2">
    <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
      {renderInline(content)}
    </div>
    {products?.length > 0 && (
      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl hover:border-black transition-colors"
          >
            {p.image ? (
              <img
                src={p.image}
                alt=""
                className="w-12 h-12 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
            )}
            <span className="text-xs font-medium text-gray-900 line-clamp-2">
              {p.name}
              {p.avgRating > 0 && (
                <span className="block text-gray-500 font-normal">
                  ⭐ {p.avgRating}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    )}
  </div>
);

const ChatWidget = () => {
  const userInfo = useSelector((state) => state.orebiReducer?.userInfo);
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("popup");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  // Load lịch sử chat từ MongoDB khi mở chat và đã đăng nhập
  useEffect(() => {
    if (!open || !userInfo || !token) return;

    const loadChatHistory = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([
            {
              role: "bot",
              content:
                "Xin chào! Mình là trợ lý tư vấn OREBI. Bạn cần gợi ý sản phẩm hay hỏi về giao hàng, đổi trả?",
              products: [],
            },
          ]);
        }
      } catch (error) {
        console.error("Load chat history error:", error);
        setMessages([
          {
            role: "bot",
            content:
              "Xin chào! Mình là trợ lý tư vấn OREBI. Bạn cần gợi ý sản phẩm hay hỏi về giao hàng, đổi trả?",
            products: [],
          },
        ]);
      }
    };

    loadChatHistory();
  }, [open, userInfo, token]);

  // Xóa session storage khi logout
  useEffect(() => {
    if (!userInfo) {
      sessionStorage.removeItem(STORAGE_KEY);
      setMessages([]);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!open) return;
    axios
      .get(`${serverUrl}/api/chat/suggestions`)
      .then((res) => setSuggestions(res.data?.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
    ]);
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/chat/message`,
        { message: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.reply || "Đã nhận tin nhắn của bạn.",
          products: data.products || [],
        },
      ]);
    } catch (error) {
      if (error.response?.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "Vui lòng đăng nhập để sử dụng chatbot.",
            products: [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content:
              "Mình chưa kết nối được máy chủ. Kiểm tra server đang chạy (port 8000) rồi thử lại nhé.",
            products: [],
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Chỉ hiển thị chat widget khi đã đăng nhập
  if (!userInfo) {
    return null;
  }

  return (
    <>
      {open && (
        <div
          className={
              mode === "fullscreen"
              ? "fixed inset-0 z-[60] flex flex-col bg-white shadow-2xl overflow-hidden"

              : "fixed bottom-24 left-4 sm:left-8 z-[60] w-[min(100vw-2rem,380px)] h-[min(70vh,520px)] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          }

          role="dialog"
          aria-label="Chat tư vấn OREBI"
        >
          <div className="flex items-start justify-between px-4 pt-3 pb-3 bg-black text-white shrink-0">
            <div>

              <p className="font-semibold text-sm">Tư vấn OREBI</p>
              <p className="text-xs text-gray-300">Trợ lý tự động · 24/7</p>
            </div>
            <div className="flex items-center self-start justify-end -space-x-1">
              {mode !== "fullscreen" && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-0.5 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 flex-shrink-0"
                  aria-label="Đóng chat"
                >
                  <span className="relative block w-5 h-5">
                    <IoClose className="w-5 h-5 absolute inset-0" />
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setMode((m) => (m === "fullscreen" ? "popup" : "fullscreen"))
                }
                className="p-0.5 text-white bg-white/10 hover:bg-white/15 rounded-full"
                aria-label="Chuyển chế độ hiển thị"
              >
                <span className="block w-5 h-5 text-xl leading-none text-right">
                  ⤢

                </span>
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            className={
              mode === "fullscreen"
                ? "flex-1 overflow-y-auto px-3 py-2 space-y-3 bg-gray-50"
                : "flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50"
            }
          >
            {messages.map((msg, idx) =>
              msg.role === "user" ? (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[85%] bg-black text-white text-sm rounded-2xl rounded-tr-sm px-3 py-2">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex justify-start">
                  <div>
                    <BotBubble content={msg.content} products={msg.products} />
                  </div>
                </div>
              )
            )}
            {loading && (
              <p className="text-xs text-gray-500 px-1">Đang trả lời...</p>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="px-2 pb-2 flex flex-wrap gap-1.5 shrink-0 bg-gray-50 border-t border-gray-100">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-300 bg-white hover:border-black disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-2 sm:p-3 border-t border-gray-200 bg-white shrink-0"

          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 text-sm border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-black"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full disabled:opacity-40"
              aria-label="Gửi"
            >
              <IoSend className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="fixed bottom-8 left-4 sm:left-8 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all bg-black text-white hover:bg-gray-800 hover:scale-105"
          aria-label="Mở chat tư vấn"
        >
          <IoChatbubbleEllipses className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default ChatWidget;
