import React, { useState, useMemo, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { ColumnMapping } from './components/ColumnMapping';
import { RegionConfig } from './components/RegionConfig';
import { FilterBar } from './components/FilterBar';
import { PLStatement } from './components/PLStatement';
import { LayoutDashboard, Table as TableIcon, BarChart3, Key, LogOut, Settings } from 'lucide-react';
import { initializeGemini } from './lib/gemini';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    if (apiKey) {
      const success = initializeGemini(apiKey);
      if (success) {
        setIsConfigured(true);
      }
    }
  }, [apiKey]);

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (!tempKey.trim()) return;

    const key = tempKey.trim();
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setIsSkipped(false);
    setShowKeyInput(false);
  };

  const handleSkip = () => {
    setIsSkipped(true);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsConfigured(false);
    setTempKey('');
    window.location.reload();
  };

  const [step, setStep] = useState('upload'); // 'upload' | 'mapping' | 'region' | 'analysis'
  const [rawFile, setRawFile] = useState({ data: null, headers: [] });
  const [mappedData, setMappedData] = useState(null); // Intermediate data after mapping
  const [data, setData] = useState(null); // Final processed data
  const [view, setView] = useState('dashboard');

  // Filters
  const [filters, setFilters] = useState({ company: 'all', region: 'all', storeType: 'all' });

  const handleFileLoaded = (uploadedData, headers) => {
    setRawFile({ data: uploadedData, headers });
    setStep('mapping');
  };

  const handleMappingConfirmed = (mapping) => {
    const transformed = rawFile.data.map(row => {
      const newRow = {};
      Object.entries(mapping).forEach(([internalKey, excelHeader]) => {
        newRow[internalKey] = row[excelHeader];
      });
      return newRow;
    });
    setMappedData(transformed);
    setStep('region');
  };

  const handleRegionConfirmed = (rules) => {
    const processed = mappedData.map(row => {
      const deptCode = String(row['部門代號'] || '');
      const deptName = String(row['部門名稱'] || '');

      // Region Logic
      let region = '其他';
      for (const [r, prefixes] of Object.entries(rules)) {
        if (prefixes.some(p => {
          // Convert wildcard '*' to regex '.*'
          // Escape special regex characters except '*'
          const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
          const pattern = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
          return pattern.test(deptCode);
        })) {
          region = r;
          break;
        }
      }

      // Store Type Logic
      const storeType = (deptName.endsWith('營業處') || deptName.includes('社福本部'))
        ? '直營店'
        : '加盟店';

      return { ...row, region, storeType };
    });

    setData(processed);
    setStep('analysis');
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(row => {
      if (filters.company !== 'all' && row['公司名稱'] !== filters.company) return false;
      if (filters.region !== 'all' && row['region'] !== filters.region) return false;
      if (filters.storeType !== 'all' && row['storeType'] !== filters.storeType) return false;
      return true;
    });
  }, [data, filters]);

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    if (!data) return { companies: [], regions: [] };
    const companies = [...new Set(data.map(r => r['公司名稱']).filter(Boolean))];
    const regions = [...new Set(data.map(r => r['region']).filter(Boolean))];
    return { companies, regions };
  }, [data]);

  // Key Input Modal / Screen
  if (!isConfigured && !isSkipped && !showKeyInput) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">歡迎使用損益分析工具</h1>
            <p className="text-slate-600">請輸入您的 Gemini API Key 以啟用 AI 分析功能</p>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
              <p className="mt-2 text-xs text-slate-500">
                您的 Key 僅會儲存在瀏覽器中，不會傳送至任何伺服器。
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                啟用 AI 功能
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="w-full bg-white text-slate-600 py-3 rounded-lg font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                暫時跳過 (僅使用基本功能)
              </button>
            </div>

            <div className="text-center">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                👉 取得免費 API Key
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Key Input Modal if requested from header
  if (showKeyInput) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 relative">
          <button
            onClick={() => setShowKeyInput(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">設定 API Key</h1>
            <p className="text-slate-600">輸入 Key 以解鎖 AI 分析功能</p>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              儲存設定
            </button>

            <div className="text-center">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                👉 取得免費 API Key
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          {isConfigured ? (
            <button
              onClick={handleClearKey}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
              title="清除 API Key"
            >
              <LogOut className="w-4 h-4" />
              登出 Key
            </button>
          ) : (
            <button
              onClick={() => setShowKeyInput(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              <Key className="w-4 h-4" />
              設定 AI Key
            </button>
          )}
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">損益分析工具</h1>
          <p className="text-slate-600">請上傳您的損益表 Excel 檔案以開始</p>
        </div>
        <FileUpload onDataLoaded={handleFileLoaded} />
      </div>
    );
  }

  if (step === 'mapping') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <ColumnMapping
          headers={rawFile.headers}
          sampleData={rawFile.data}
          onConfirm={handleMappingConfirmed}
          onCancel={() => setStep('upload')}
        />
      </div>
    );
  }

  if (step === 'region') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <RegionConfig
          sampleData={mappedData}
          onConfirm={handleRegionConfirmed}
          onCancel={() => setStep('mapping')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">損益分析</h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                儀表板
              </div>
            </button>
            <button
              onClick={() => setView('pl-statement')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'pl-statement'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                損益表
              </div>
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                詳細資料
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('region')}
              className="text-sm text-slate-500 hover:text-slate-900 font-medium"
            >
              上一步
            </button>
            <button
              onClick={() => {
                setData(null);
                setMappedData(null); // Reset mapped data as well
                setStep('upload');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              上傳新檔案
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            {isConfigured ? (
              <button
                onClick={handleClearKey}
                className="text-slate-400 hover:text-red-600 transition-colors"
                title="清除 API Key"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowKeyInput(true)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="設定 API Key"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterBar
          filters={filters}
          onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
          options={filterOptions}
        />

        {view === 'dashboard' ? (
          <Dashboard data={filteredData} fullData={data} isConfigured={isConfigured} />
        ) : view === 'pl-statement' ? (
          <PLStatement data={filteredData} />
        ) : (
          <DataTable data={filteredData} />
        )}
      </main>

      {/* Modal for late configuration */}
      {showKeyInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 relative">
            <button
              onClick={() => setShowKeyInput(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">設定 API Key</h1>
              <p className="text-slate-600">輸入 Key 以解鎖 AI 分析功能</p>
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                儲存設定
              </button>

              <div className="text-center">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  👉 取得免費 API Key
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
