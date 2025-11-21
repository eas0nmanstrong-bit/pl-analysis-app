import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const DEFAULT_REGIONS = ['本部', '台南區', '台北區', '新竹區', '澎湖區', '台中區', '高雄區'];

export function RegionConfig({ sampleData, onConfirm, onCancel }) {
  // Rules structure: { '台北區': ['10*', 'A'], '台中區': ['20'] }
  const [rules, setRules] = useState({
    '本部': ['*004-000'],
    '台南區': ['*004-001*'],
    '台北區': ['*004-002*'],
    '新竹區': ['*004-003*'],
    '澎湖區': ['*004-004*'],
    '台中區': ['*004-005*'],
    '高雄區': ['*004-006*']
  });
  const [newPrefix, setNewPrefix] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGIONS[0]);
  const [isCustomRegion, setIsCustomRegion] = useState(false);

  const addRule = () => {
    if (!newPrefix || !selectedRegion) return;
    setRules(prev => ({
      ...prev,
      [selectedRegion]: [...(prev[selectedRegion] || []), newPrefix]
    }));
    setNewPrefix('');
  };

  const removeRule = (region, prefix) => {
    setRules(prev => {
      const newRules = { ...prev };
      newRules[region] = newRules[region].filter(p => p !== prefix);
      if (newRules[region].length === 0) delete newRules[region];
      return newRules;
    });
  };

  // Preview classification
  const previewData = sampleData.slice(0, 5).map(row => {
    const deptCode = String(row['部門代號'] || '');
    let matchedRegion = '其他';

    for (const [region, prefixes] of Object.entries(rules)) {
      if (prefixes.some(p => {
        // Convert wildcard '*' to regex '.*'
        // Escape special regex characters except '*'
        const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
        return pattern.test(deptCode);
      })) {
        matchedRegion = region;
        break;
      }
    }
    return { code: deptCode, name: row['部門名稱'], region: matchedRegion };
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">區域設定</h2>
        <p className="text-slate-600">定義部門分類規則。您可以使用 "*" 作為萬用字元 (例如 "10*" 代表所有以 10 開頭的代碼)。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rule Editor */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">新增規則</label>

            <div className="space-y-3">
              {/* Region Selector/Input */}
              <div className="flex gap-2">
                {isCustomRegion ? (
                  <input
                    type="text"
                    placeholder="輸入區域名稱"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomRegion(true);
                        setSelectedRegion('');
                      } else {
                        setSelectedRegion(e.target.value);
                      }
                    }}
                    className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {DEFAULT_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="CUSTOM">+ 新增自訂區域...</option>
                  </select>
                )}
                {isCustomRegion && (
                  <button
                    onClick={() => { setIsCustomRegion(false); setSelectedRegion(DEFAULT_REGIONS[0]); }}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap px-2"
                  >
                    取消
                  </button>
                )}
              </div>

              {/* Prefix Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="代碼開頭為 (例如 10*)"
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={addRule}
                  disabled={!newPrefix || !selectedRegion}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-slate-900">目前規則</h3>
            {Object.entries(rules).length === 0 && (
              <p className="text-sm text-slate-500 italic">尚未定義規則。</p>
            )}
            {Object.entries(rules).map(([region, prefixes]) => (
              prefixes.length > 0 && (
                <div key={region} className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="font-medium text-slate-700 mb-2">{region}</div>
                  <div className="flex flex-wrap gap-2">
                    {prefixes.map(prefix => (
                      <span key={prefix} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {prefix}
                        <button onClick={() => removeRule(region, prefix)} className="hover:text-blue-900">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-medium text-slate-900 mb-4">分類預覽</h3>
          <div className="space-y-3">
            {previewData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm bg-white p-3 rounded border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">{item.code}</div>
                  <div className="text-slate-500">{item.name}</div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded font-medium",
                  item.region === '其他' ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-700"
                )}>
                  {item.region}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          上一步
        </button>
        <button
          onClick={() => onConfirm(rules)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md transition-all"
        >
          確認規則
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
