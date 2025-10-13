'use client';

import { useState, useEffect } from 'react';

interface DocumentInfo {
  filename: string;
  chunk_count: number;
  file_type: string;
  upload_timestamp: string;
}

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  // ドキュメント一覧を取得
  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/documents/list');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  // 統計情報を取得
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/rag/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      fetchStats();
    }
  }, [isOpen]);

  // ファイルアップロード
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus('アップロード中...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(`✅ アップロード成功: ${data.chunks_created}チャンク作成`);
        fetchDocuments();
        fetchStats();
      } else {
        const error = await response.json();
        setUploadStatus(`❌ エラー: ${error.detail}`);
      }
    } catch (error) {
      setUploadStatus('❌ アップロードに失敗しました');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  // ドキュメント削除
  const handleDelete = async (filename: string) => {
    if (!confirm(`「${filename}」を削除しますか？`)) return;

    try {
      const response = await fetch(`http://localhost:8000/api/documents/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadStatus('✅ 削除しました');
        fetchDocuments();
        fetchStats();
      } else {
        setUploadStatus('❌ 削除に失敗しました');
      }
    } catch (error) {
      setUploadStatus('❌ 削除に失敗しました');
      console.error('Delete error:', error);
    } finally {
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">📚 ドキュメント管理</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 統計情報 */}
        {stats && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.unique_documents}</div>
                <div className="text-sm text-gray-600">ドキュメント数</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total_chunks}</div>
                <div className="text-sm text-gray-600">総チャンク数</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.embedding_dimension}</div>
                <div className="text-sm text-gray-600">ベクトル次元</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.top_k}</div>
                <div className="text-sm text-gray-600">検索件数</div>
              </div>
            </div>
          </div>
        )}

        {/* アップロードセクション */}
        <div className="px-6 py-4 border-b border-gray-200">
          <label className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all cursor-pointer shadow-lg hover:shadow-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-lg font-bold">ファイルをアップロード</span>
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
          </label>
          {uploadStatus && (
            <div className="mt-3 text-center text-sm font-medium">
              {uploadStatus}
            </div>
          )}
          <div className="mt-2 text-center text-xs text-gray-500">
            対応形式: .txt, .md, .pdf
          </div>
        </div>

        {/* ドキュメント一覧 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">ドキュメントがありません</p>
              <p className="text-sm mt-2">上のボタンからファイルをアップロードしてください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="font-bold text-gray-900 truncate">{doc.filename}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {doc.file_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📊 {doc.chunk_count} チャンク</span>
                        <span>🕒 {new Date(doc.upload_timestamp).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.filename)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all"
                      aria-label="削除"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
