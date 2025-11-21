import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

export function FileUpload({ onDataLoaded }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const processFile = async (file) => {
        setLoading(true);
        setError(null);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            if (jsonData.length === 0) {
                throw new Error("Excel file appears to be empty");
            }

            // Get headers from the first row keys
            const headers = Object.keys(jsonData[0] || {});

            if (headers.length === 0) {
                throw new Error("Could not detect any columns in the file");
            }

            onDataLoaded(jsonData, headers);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to parse Excel file");
        } finally {
            setLoading(false);
            setIsDragging(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            processFile(files[0]);
        }
    }, []);

    const handleChange = (e) => {
        const files = e.target.files;
        if (files && files[0]) {
            processFile(files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 ease-in-out text-center cursor-pointer",
                    isDragging
                        ? "border-blue-500 bg-blue-50 scale-[1.02]"
                        : "border-slate-300 hover:border-slate-400 bg-white",
                    loading && "opacity-50 cursor-wait"
                )}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                        "p-4 rounded-full transition-colors",
                        isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                    )}>
                        {loading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
                        ) : (
                            <FileSpreadsheet className="w-8 h-8" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {loading ? "處理中..." : "上傳損益表 Excel 檔案"}
                        </h3>
                        <p className="text-sm text-slate-500">
                            將檔案拖放到此處，或點擊瀏覽
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
}
