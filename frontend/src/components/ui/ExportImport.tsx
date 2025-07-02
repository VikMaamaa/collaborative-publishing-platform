'use client';

import { useState, useRef } from 'react';
import { Button, Modal } from './index';
import { 
  exportPosts, 
  exportOrganizations, 
  importPosts, 
  importOrganizations,
  downloadBlob,
  getFileExtension,
  ExportOptions,
  ImportOptions 
} from '@/lib/export-import';

interface ExportImportProps {
  type: 'posts' | 'organizations';
  data: any[];
  onImport?: (data: any[]) => void;
  className?: string;
}

export default function ExportImport({ type, data, onImport, className = '' }: ExportImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'markdown'>('json');
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'markdown'>('json');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      setProgress(0);

      const options: ExportOptions = {
        format: exportFormat,
        includeMetadata: true,
      };

      const blob = type === 'posts' 
        ? exportPosts(data, options)
        : exportOrganizations(data, options);

      const filename = `${type}_export_${new Date().toISOString().split('T')[0]}${getFileExtension(exportFormat)}`;
      downloadBlob(blob, filename);

      setProgress(100);
      setTimeout(() => {
        setIsModalOpen(false);
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(0);

      const options: ImportOptions = {
        format: importFormat,
        validateData: true,
        onProgress: (p) => setProgress(p),
      };

      const importedData = type === 'posts'
        ? await importPosts(file, options)
        : await importOrganizations(file, options);

      if (onImport) {
        onImport(importedData);
      }

      setProgress(100);
      setTimeout(() => {
        setIsModalOpen(false);
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Import failed:', error);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const openModal = (type: 'export' | 'import') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'Structured data format' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet format' },
    ...(type === 'posts' ? [{ value: 'markdown', label: 'Markdown', description: 'Document format' }] : []),
  ];

  return (
    <>
      <div className={`flex space-x-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openModal('export')}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openModal('import')}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          }
        >
          Import
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isProcessing && setIsModalOpen(false)}
        title={modalType === 'export' ? 'Export Data' : 'Import Data'}
        size="md"
      >
        <div className="space-y-6">
          {modalType === 'export' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="space-y-2">
                  {formatOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={option.value}
                        checked={exportFormat === option.value}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Exporting {data.length} {type} in {exportFormat.toUpperCase()} format.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Format
                </label>
                <div className="space-y-2">
                  {formatOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="importFormat"
                        value={option.value}
                        checked={importFormat === option.value}
                        onChange={(e) => setImportFormat(e.target.value as any)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={`.${importFormat}`}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  Choose File
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  Select a {importFormat.toUpperCase()} file to import
                </p>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {modalType === 'export' && (
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={isProcessing}
                loading={isProcessing}
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
} 