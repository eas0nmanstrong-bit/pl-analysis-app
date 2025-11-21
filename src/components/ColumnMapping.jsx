import React, { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const REQUIRED_FIELDS = [
    { key: '日期', label: '日期 (Date)', required: true },
    { key: '科目代號', label: '科目代號 (Account Code)', required: true },
    { key: '科目名稱', label: '科目名稱 (Account Name)', required: true },
    { key: '部門代號', label: '部門代號 (Dept Code)', required: true },
    { key: '部門名稱', label: '部門名稱 (Department)', required: true },
    { key: '公司名稱', label: '公司名稱 (Company)', required: true },
    { key: '摘要', label: '摘要 (Summary)', required: true },
    { key: '借方金額', label: '借方金額 (Debit)', required: true },
    { key: '貸方金額', label: '貸方金額 (Credit)', required: true },
    { key: '專案', label: '專案 (Project)', required: false },
];

// Aliases for auto-mapping
const ALIASES = {
    '日期': ['會計日期', 'date', '日期'],
    '科目代號': ['科目代碼', 'account code', 'acct code'],
    '部門代號': ['項目代碼1', 'dept code'],
    '部門名稱': ['項目名稱1', 'department'],
    '公司名稱': ['核算組織名稱', 'company'],
    '借方金額': ['借方', 'debit'],
    '貸方金額': ['貸方', 'credit'],
    '專案': ['項目名稱2', 'project']
};

export function ColumnMapping({ headers, sampleData, onConfirm, onCancel }) {
    const [mapping, setMapping] = useState({});

    // Auto-guess based on exact or partial match
    useEffect(() => {
        const initialMapping = {};
        REQUIRED_FIELDS.forEach(field => {
            const aliases = ALIASES[field.key] || [];
            const match = headers.find(h => {
                const lowerH = h.toLowerCase();
                // Check exact key match
                if (h === field.key) return true;
                // Check aliases
                if (aliases.some(alias => lowerH === alias.toLowerCase() || lowerH.includes(alias.toLowerCase()))) return true;
                // Check label keywords (fallback)
                if (field.label.includes('Date') && lowerH.includes('date')) return true;
                if (field.label.includes('Account') && lowerH.includes('account')) return true;
                return false;
            });

            if (match) {
                initialMapping[field.key] = match;
            }
        });
        setMapping(initialMapping);
    }, [headers]);

    const handleChange = (internalKey, excelHeader) => {
        setMapping(prev => ({ ...prev, [internalKey]: excelHeader }));
    };

    const isValid = REQUIRED_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">欄位對應</h2>
                <p className="text-slate-600">請選擇 Excel 檔案中對應的欄位。</p>
            </div>

            <div className="space-y-4 mb-8">
                {REQUIRED_FIELDS.map((field) => (
                    <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-slate-50 rounded-lg">
                        <div className="font-medium text-slate-700 flex items-center gap-2">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                        </div>

                        <div className="md:col-span-2 flex gap-4">
                            <select
                                value={mapping[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className={cn(
                                    "flex-1 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                                    !mapping[field.key] && field.required && "border-orange-300 bg-orange-50"
                                )}
                            >
                                <option value="">-- 選擇欄位 --</option>
                                {headers.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>

                            {/* Preview value */}
                            <div className="w-1/3 text-sm text-slate-500 truncate flex items-center">
                                {mapping[field.key] ? (
                                    <span className="italic">
                                        範例: {String(sampleData[0]?.[mapping[field.key]] || '-')}
                                    </span>
                                ) : (
                                    <span>-</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                    上一步
                </button>
                <button
                    onClick={() => onConfirm(mapping)}
                    disabled={!isValid}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all",
                        isValid
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                >
                    確認對應
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
