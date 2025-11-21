import React, { useMemo } from 'react';
import { formatNumber, generatePLStatement } from '../lib/analytics';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export function PLStatement({ data }) {
    const plData = useMemo(() => {
        if (!data) return null;
        return generatePLStatement(data);
    }, [data]);

    if (!plData) return null;

    const { details, grossProfit, operatingIncome, netIncome } = plData;

    const Section = ({ title, data, isNegative = false }) => (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex justify-between items-center">
                {title}
                <span className={`text-base ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatNumber(data.value)}
                </span>
            </h3>
            <div className="space-y-1">
                {data.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 rounded text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                            <span className="font-mono text-xs text-slate-400">{item.code}</span>
                            <span>{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-700">{formatNumber(item.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const SummaryRow = ({ label, value, isTotal = false }) => (
        <div className={`flex justify-between items-center p-4 rounded-lg ${isTotal ? 'bg-slate-900 text-white mt-8' : 'bg-slate-100 text-slate-900 mt-4'
            }`}>
            <span className={`font-bold ${isTotal ? 'text-lg' : 'text-base'}`}>{label}</span>
            <div className="flex items-center gap-2">
                {value > 0 ? <ArrowUp className="w-4 h-4 text-emerald-400" /> : value < 0 ? <ArrowDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4" />}
                <span className={`font-bold ${isTotal ? 'text-xl' : 'text-lg'}`}>{formatNumber(value)}</span>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">損益表</h2>
                <p className="text-slate-500 mt-1">Profit & Loss Statement</p>
            </div>

            <div className="grid gap-8">
                {/* Operating Revenue */}
                <Section title="營業收入" data={details.revenue} />

                {/* Operating Costs */}
                <Section title="營業成本" data={details.costs} isNegative />

                {/* Gross Profit */}
                <SummaryRow label="營業毛利" value={grossProfit} />

                {/* Operating Expenses */}
                <Section title="營業費用" data={details.expenses} isNegative />

                {/* Operating Income */}
                <SummaryRow label="營業利益" value={operatingIncome} />

                {/* Non-Operating */}
                <Section title="營業外收支" data={details.nonOperating} />

                {/* Net Income */}
                <SummaryRow label="本期淨利" value={netIncome} isTotal />
            </div>
        </div>
    );
}
