import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Loader2, AlertCircle, Lock } from 'lucide-react';
import { generateInsights } from '../lib/gemini';

export default function AIInsights({ data, isConfigured }) {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadInsights = async () => {
        if (!isConfigured) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateInsights(data);
            setInsights(result);
        } catch (err) {
            console.error("AI Insight Error:", err);
            setError(err.message || '無法生成洞察，請重試。');
        } finally {
            setIsLoading(false);
        }
    };

    // Clear insights when data changes, but don't auto-load
    useEffect(() => {
        setInsights([]);
        setError(null);
    }, [data]);

    if (!data) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-indigo-100">
                        <Lightbulb className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-950">AI 策略洞察</h3>
                        <p className="text-xs text-indigo-600/80 font-medium">自動化分析</p>
                    </div>
                </div>
                {insights.length > 0 && (
                    <button
                        onClick={loadInsights}
                        disabled={isLoading}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all disabled:opacity-50 text-indigo-600"
                        title="重新整理洞察"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-sm font-medium animate-pulse">正在分析財務數據...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button
                        onClick={loadInsights}
                        className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 font-medium transition-colors shadow-sm"
                    >
                        重試分析
                    </button>
                </div>
            ) : insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-indigo-900/60 gap-4">
                    <p className="text-sm text-center max-w-[80%]">
                        {isConfigured
                            ? "點擊下方按鈕，讓 AI 為您分析當前的財務數據並提供策略建議。"
                            : "請先設定 API Key 以啟用 AI 分析功能。"
                        }
                    </p>
                    {isConfigured ? (
                        <button
                            onClick={loadInsights}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <Lightbulb className="w-5 h-5" />
                            <span className="font-medium">開始 AI 分析</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-xl cursor-not-allowed">
                            <Lock className="w-5 h-5" />
                            <span className="font-medium">功能未啟用</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="group flex gap-4 items-start bg-white p-4 rounded-xl border border-indigo-50 shadow-sm hover:shadow-md transition-all duration-200">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {idx + 1}
                            </span>
                            <p className="text-indigo-900 text-sm leading-relaxed font-medium">{insight}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
