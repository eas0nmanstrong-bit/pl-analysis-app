import React from 'react';
import { Filter } from 'lucide-react';

export function FilterBar({ filters, onFilterChange, options }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-500 mr-2">
                <Filter className="w-5 h-5" />
                <span className="font-medium">篩選:</span>
            </div>

            <select
                value={filters.company}
                onChange={(e) => onFilterChange('company', e.target.value)}
                className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
                <option value="all">所有公司</option>
                {options.companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
                value={filters.region}
                onChange={(e) => onFilterChange('region', e.target.value)}
                className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
                <option value="all">所有區域</option>
                {options.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
                value={filters.storeType}
                onChange={(e) => onFilterChange('storeType', e.target.value)}
                className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
                <option value="all">所有店型</option>
                <option value="直營店">直營店</option>
                <option value="加盟店">加盟店</option>
            </select>
        </div>
    );
}
