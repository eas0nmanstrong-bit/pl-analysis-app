import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Lock } from 'lucide-react';
import { askQuestion } from '../lib/gemini';

export default function AIChat({ data, isConfigured }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '您好！我可以協助您分析財務數據。歡迎隨時提問！' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !isConfigured) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await askQuestion(data, userMessage);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，發生錯誤，請稍後再試。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800">AI 財務助手</h3>
                    <p className="text-xs text-gray-500">由 Gemini 提供支援</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-500">正在分析財務數據...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isConfigured ? "詢問關於營收、支出或趨勢..." : "請先設定 API Key 以使用對話功能"}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={isLoading || !isConfigured}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !isConfigured}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md active:scale-95 transform duration-100 flex items-center justify-center"
                    >
                        {isConfigured ? <Send className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
