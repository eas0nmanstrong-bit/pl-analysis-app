import React, { useMemo, useState } from 'react';
import { calculateMetrics, formatCurrency } from '../lib/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, MessageSquare, X } from 'lucide-react';
import AIInsights from './AIInsights';
import AIChat from './AIChat';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Dashboard({ data, fullData, isConfigured }) {
    const [showChat, setShowChat] = useState(false);
    const metrics = useMemo(() => calculateMetrics(data), [data]);

    // Calculate region metrics using fullData (unfiltered)
    const fullMetrics = useMemo(() => calculateMetrics(fullData), [fullData]);

    return (
        <div className="space-y-6 relative">
            {/* AI Insights Panel */}
            <AIInsights data={metrics} isConfigured={isConfigured} />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">總收入</h3>
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalCredit)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">總支出</h3>
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalDebit)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">淨利</h3>
                        <div className={`p-2 rounded-full ${metrics.netIncome >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold ${metrics.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(metrics.netIncome)}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">淨利率</h3>
                        <div className={`p-2 rounded-full ${metrics.profitMargin >= 0 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{metrics.profitMargin.toFixed(1)}%</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Store Type Net Income Share */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">各店型損益占比</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.storeTypeNetIncomeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {metrics.storeTypeNetIncomeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name, props) => [formatCurrency(props.payload.realValue), name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Region Performance (Unfiltered) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">區域損益狀況 (不受篩選影響)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fullMetrics.regionChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="net" name="淨利" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Revenue Accounts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">收入前五大科目</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topRevenueAccounts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="value" name="收入" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 5 Expense Accounts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">支出前五大科目</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topExpenseAccounts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="value" name="支出" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 3 - Profitability Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Profit */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">淨利前五大部門</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topProfitDepartments} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="net" name="淨利" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 5 Margin */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">淨利率前五大部門</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topMarginDepartments} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" unit="%" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                <Bar dataKey="margin" name="淨利率" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Chat Widget */}
            <div className="fixed bottom-6 right-6 z-50">
                {showChat ? (
                    <div className="relative w-[400px] shadow-2xl rounded-xl animate-in slide-in-from-bottom-10 fade-in duration-200">
                        <button
                            onClick={() => setShowChat(false)}
                            className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 border border-gray-100 transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <AIChat data={metrics} isConfigured={isConfigured} />
                    </div>
                ) : (
                    <button
                        onClick={() => setShowChat(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group"
                    >
                        <MessageSquare className="w-6 h-6 group-hover:animate-bounce" />
                        <span className="font-medium pr-1">AI 助手</span>
                    </button>
                )}
            </div>
        </div>
    );
}
