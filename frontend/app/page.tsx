"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

// Tipe data untuk pesan chat
type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  // Pesan awal bot
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Halo! Saya Hans Capon. Silakan tanyakan apa saja seputar POLMAN, dan kalau mau upload pdf lalu tanyakan isinya kepada saya" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState(""); // State untuk Session ID
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Generate Session ID Unik saat halaman pertama kali dibuka
  useEffect(() => {
    let currentSession = localStorage.getItem("chatSessionId");
    if (!currentSession) {
      currentSession = `session-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("chatSessionId", currentSession);
    }
    setSessionId(currentSession);
    console.log("Session ID:", currentSession);
  }, []);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- FUNGSI HANDLE UPLOAD PDF ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId); 

    setMessages((prev) => [
        ...prev, 
        { role: "bot", content: `📂 Sedang mempelajari dokumen: "${file.name}"... Mohon tunggu.` }
    ]);

    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload");

      setMessages((prev) => [
        ...prev, 
        { role: "bot", content: "✅ Dokumen berhasil dipelajari! Sekarang kamu bisa bertanya tentang isinya." }
    ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev, 
        { role: "bot", content: "❌ Gagal memproses dokumen. Pastikan backend Python aktif." }
      ]);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input file
    }
  };

  // --- FUNGSI KIRIM CHAT ---
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userMessage,
            sessionId: sessionId 
        }),
      });

      if (!res.ok) throw new Error("Gagal fetch data");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "⚠️ Maaf, terjadi kesalahan koneksi ke server backend." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <main className="flex min-h-screen flex-col items-center justify-between bg-[#393D7E] text-slate-100">
      
      {/* Header - WARNA BACKGROUND (#7132CA) */}
      <div className="w-full bg-[#7132CA] p-4 shadow-md border-b border-white/10 fixed top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <div>
            <h1 className="font-bold text-xl text-white">Polman RAG ChatBot</h1>
            <p className="text-xs text-indigo-200">Session: {sessionId}</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-3xl pt-24 pb-32 px-4 flex flex-col gap-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-lg overflow-hidden ${
                msg.role === "user"
                  // USER BUBBLE (#C47BE4)
                  ? "bg-[#C47BE4] text-white rounded-br-none font-medium"
                  // BOT BUBBLE (Netral agak gelap biar kontras)
                  : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-600"
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-600">
              <span className="text-slate-400 text-sm">Sedang berpikir...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - WARNA BACKGROUND (#7132CA) */}
      <div className="w-full fixed bottom-0 bg-[#7132CA] border-t border-white/10 p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
            
            {/* Tombol Upload */}
            <div className="flex">
                <label className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border border-white/20
                    ${isUploading 
                        ? "bg-slate-600 text-slate-400 cursor-not-allowed" 
                        // Upload button menyesuaikan tema (#5459AC)
                        : "bg-[#5459AC] hover:bg-[#464aa0] text-white shadow-sm"}
                `}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                    </svg>
                    {isUploading ? "Memproses..." : "Upload PDF"}
                    <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={isUploading}
                    />
                </label>
            </div>

            {/* Input Chat */}
            <div className="flex gap-3">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ketik pertanyaanmu di sini..."
                // Input box pakai warna background utama (#5459AC) biar terlihat "tenggelam" di footer
                className="flex-1 bg-[#5459AC] text-white border border-white/20 rounded-xl px-5 py-3 placeholder:text-indigo-200 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                disabled={isLoading}
            />
            <button
                onClick={sendMessage}
                disabled={isLoading}
                // TOMBOL KIRIM (#C47BE4)
                className="bg-[#C47BE4] hover:opacity-90 text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
            </button>
            </div>
        </div>
      </div>
    </main>
  );
}