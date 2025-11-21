import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { parseDate, formatCurrency } from '../lib/analytics';

export function DataTable({ data }) {
    const [conditions, setConditions] = useState([]);
    const [newCondition, setNewCondition] = useState({ column: '科目名稱', value: '' });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const columns = [
        { key: '日期', label: '日期' },
        { key: '科目名稱', label: '科目名稱' },
        { key: '部門名稱', label: '部門名稱' },
        { key: '摘要', label: '摘要' },
        { key: '借方金額', label: '借方金額', className: 'text-right', format: formatCurrency },
        { key: '貸方金額', label: '貸方金額', className: 'text-right', format: formatCurrency },
        { key: '專案', label: '專案' },
    ];

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const searchColumns = [
        { key: '日期', label: '日期' },
        { key: '科目名稱', label: '科目名稱' },
        { key: '部門名稱', label: '部門名稱' },
        { key: '摘要', label: '摘要' },
        { key: '借方金額', label: '借方金額' },
        { key: '貸方金額', label: '貸方金額' },
        { key: '專案', label: '專案' },
    ];

    const addCondition = () => {
        if (newCondition.value.trim()) {
            setConditions([...conditions, { ...newCondition, id: Date.now() }]);
            setNewCondition({ ...newCondition, value: '' });
        }
    };

    const removeCondition = (id) => {
        setConditions(conditions.filter(c => c.id !== id));
    };

    const filteredAndSortedData = useMemo(() => {
        let processed = [...data];

        // Filter by multiple conditions (AND logic)
        if (conditions.length > 0) {
            processed = processed.filter(row => {
                return conditions.every(cond => {
                    const cellValue = String(row[cond.column] || '').toLowerCase();
                    const searchVal = cond.value.toLowerCase();
                    return cellValue.includes(searchVal);
                });
            });
        }

        // Sort
        if (sortConfig.key) {
            processed.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle dates
                if (sortConfig.key === '日期') {
                    aVal = parseDate(aVal).getTime();
                    bVal = parseDate(bVal).getTime();
                }
                // Handle numbers
                else if (['借方金額', '貸方金額'].includes(sortConfig.key)) {
                    aVal = Number(aVal || 0);
                    bVal = Number(bVal || 0);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [data, conditions, sortConfig]);

    return (
        <div className="space-y-4">
            {/* Advanced Search Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">搜尋欄位</label>
                        <select
                            value={newCondition.column}
                            onChange={(e) => setNewCondition({ ...newCondition, column: e.target.value })}
                            className="block w-40 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            {searchColumns.map(col => (
                                <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1 flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-slate-700">關鍵字</label>
                        <input
                            type="text"
                            placeholder="輸入搜尋內容..."
                            value={newCondition.value}
                            onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={addCondition}
                        disabled={!newCondition.value.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        新增條件
                    </button>
                </div>

                {/* Active Conditions */}
                {conditions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {conditions.map(cond => (
                            <span key={cond.id} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-100">
                                <span className="font-medium">{searchColumns.find(c => c.key === cond.column)?.label}:</span>
                                <span>{cond.value}</span>
                                <button onClick={() => removeCondition(cond.id)} className="hover:text-blue-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => setConditions([])}
                            className="text-sm text-slate-500 hover:text-slate-700 underline px-2"
                        >
                            清除所有條件
                        </button>
                    </div>
                )}

                <div className="text-sm text-slate-500 pt-2">
                    顯示 {filteredAndSortedData.length} / {data.length} 筆資料
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors ${col.className || ''}`}
                                    >
                                        <div className={`flex items-center gap-2 ${col.className?.includes('text-right') ? 'justify-end' : ''}`}>
                                            {col.label}
                                            {sortConfig.key === col.key ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                            ) : (
                                                <ArrowUpDown className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredAndSortedData.slice(0, 100).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className={`px-6 py-4 ${col.className || 'text-slate-600'}`}>
                                            {col.format ? col.format(row[col.key]) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {filteredAndSortedData.length > 100 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-4 text-center text-slate-500 bg-slate-50">
                                        ... 還有 {filteredAndSortedData.length - 100} 筆資料
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
