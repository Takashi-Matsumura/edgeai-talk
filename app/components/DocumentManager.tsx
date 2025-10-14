"use client";

import { useEffect, useState } from "react";

// RAGバックエンドのベースURL
const RAG_BACKEND_URL = process.env.NEXT_PUBLIC_RAG_BACKEND_URL || "http://localhost:8000";

interface DocumentInfo {
  filename: string;
  chunk_count: number;
  file_type: string;
  upload_timestamp: string;
}

interface DocumentChunk {
  chunk_index: number;
  content: string;
  char_count: number;
}

interface DocumentContent {
  filename: string;
  total_chunks: number;
  chunks: DocumentChunk[];
}

interface Template {
  id: string;
  name: string;
  filename: string;
}

interface StatsInfo {
  unique_documents: number;
  total_chunks: number;
  embedding_dimension: number;
}

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [stats, setStats] = useState<StatsInfo | null>(null);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<DocumentContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // テキストエディタモード用の状態
  const [isTextMode, setIsTextMode] = useState(false);
  const [editorText, setEditorText] = useState("");
  const [editorFilename, setEditorFilename] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // 検索機能用の状態
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ドラッグ&ドロップとリサイズ用の状態
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 900, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // ドキュメント一覧を取得
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${RAG_BACKEND_URL}/api/documents/list`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  // 統計情報を取得
  const fetchStats = async () => {
    try {
      const response = await fetch(`${RAG_BACKEND_URL}/api/rag/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // テンプレート一覧を取得
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${RAG_BACKEND_URL}/api/documents/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      fetchStats();
      fetchTemplates();
      // モーダルを開いたときにビューをリセット
      setViewingDocument(null);
      setDocumentContent(null);
      setIsTextMode(false);
      setEditorText("");
      setEditorFilename("");
      setSelectedTemplate("");
      // ポジションを中央に
      setPosition({ x: 0, y: 0 });
      setSize({ width: 900, height: 700 });
    }
  }, [isOpen, fetchDocuments, fetchStats, fetchTemplates]);

  // ドラッグ開始
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // リサイズ開始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // マウス移動
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
      if (isResizing) {
        const newWidth = Math.max(600, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(500, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  // ドキュメント内容を取得
  const fetchDocumentContent = async (filename: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(
        `${RAG_BACKEND_URL}/api/documents/content/${encodeURIComponent(filename)}`
      );
      if (response.ok) {
        const data = await response.json();
        setDocumentContent(data);
        setViewingDocument(filename);
      } else {
        setUploadStatus("❌ コンテンツの取得に失敗しました");
        setTimeout(() => setUploadStatus(""), 3000);
      }
    } catch (error) {
      console.error("Failed to fetch document content:", error);
      setUploadStatus("❌ コンテンツの取得に失敗しました");
      setTimeout(() => setUploadStatus(""), 3000);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // ドキュメントビューを閉じる
  const closeDocumentView = () => {
    setViewingDocument(null);
    setDocumentContent(null);
    setSearchQuery("");
  };

  // 検索キーワードをハイライト表示する関数
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);

    return parts
      .map((part, _index) =>
        regex.test(part) ? `<mark class="bg-yellow-300 px-1 rounded">${part}</mark>` : part
      )
      .join("");
  };

  // チャンクが検索クエリにマッチするかチェック
  const chunkMatchesSearch = (chunk: DocumentChunk) => {
    if (!searchQuery.trim()) return true;
    return chunk.content.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // テンプレート選択時の処理
  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) {
      setEditorText("");
      setSelectedTemplate("");
      return;
    }

    try {
      const response = await fetch(`${RAG_BACKEND_URL}/api/documents/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setEditorText(data.content);
        setSelectedTemplate(templateId);
        // テンプレートファイル名をデフォルトのファイル名として設定
        if (!editorFilename) {
          setEditorFilename(templateId);
        }
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      setUploadStatus("❌ テンプレートの読み込みに失敗しました");
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  // テキストをRAGに追加
  const handleTextUpload = async () => {
    if (!editorText.trim()) {
      setUploadStatus("❌ テキストを入力してください");
      setTimeout(() => setUploadStatus(""), 3000);
      return;
    }

    if (!editorFilename.trim()) {
      setUploadStatus("❌ ファイル名を入力してください");
      setTimeout(() => setUploadStatus(""), 3000);
      return;
    }

    setIsLoading(true);
    setUploadStatus("RAGに追加中...");

    try {
      const response = await fetch(`${RAG_BACKEND_URL}/api/documents/upload-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: editorText,
          filename: editorFilename,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(`✅ RAGに追加しました: ${data.chunk_count}チャンク作成`);
        // エディタをクリア
        setEditorText("");
        setEditorFilename("");
        setSelectedTemplate("");
        // ドキュメント一覧を更新
        fetchDocuments();
        fetchStats();
        // 一覧画面に戻る
        setTimeout(() => {
          setIsTextMode(false);
        }, 1500);
      } else {
        const error = await response.json();
        setUploadStatus(`❌ エラー: ${error.detail}`);
      }
    } catch (error) {
      setUploadStatus("❌ RAGへの追加に失敗しました");
      console.error("Text upload error:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  // ファイルアップロード
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus("アップロード中...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${RAG_BACKEND_URL}/api/documents/upload`, {
        method: "POST",
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
      setUploadStatus("❌ アップロードに失敗しました");
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  // ドキュメント削除
  const handleDelete = async (filename: string) => {
    if (!confirm(`「${filename}」を削除しますか？`)) return;

    try {
      const response = await fetch(
        `${RAG_BACKEND_URL}/api/documents/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setUploadStatus("✅ 削除しました");
        fetchDocuments();
        fetchStats();
      } else {
        setUploadStatus("❌ 削除に失敗しました");
      }
    } catch (error) {
      setUploadStatus("❌ 削除に失敗しました");
      console.error("Delete error:", error);
    } finally {
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          position: "relative",
        }}
      >
        {/* ヘッダー（ドラッグ可能） */}
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <h2 className="text-2xl font-bold text-white">📚 ドキュメント管理</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            aria-label="閉じる"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 統計情報とモード切り替えを横並びに */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between gap-4">
          {/* 統計情報（コンパクト） */}
          {stats && (
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-blue-600">{stats.unique_documents}</span>
                <span className="text-gray-600 ml-1">ドキュメント</span>
              </div>
              <div>
                <span className="font-bold text-blue-600">{stats.total_chunks}</span>
                <span className="text-gray-600 ml-1">チャンク</span>
              </div>
              <div>
                <span className="font-bold text-blue-600">{stats.embedding_dimension}</span>
                <span className="text-gray-600 ml-1">次元</span>
              </div>
            </div>
          )}

          {/* モード切り替えボタン（コンパクト） */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsTextMode(false)}
              className={`py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                !isTextMode
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📁 ファイル
            </button>
            <button
              onClick={() => setIsTextMode(true)}
              className={`py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                isTextMode
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ✏️ テキスト
            </button>
          </div>
        </div>

        {/* アップロードセクション（コンパクト） */}
        <div className={`px-4 py-3 border-b border-gray-200 ${isTextMode ? "" : "bg-gray-50"}`}>
          {!isTextMode ? (
            // ファイルアップロードモード
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all cursor-pointer shadow-md hover:shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="font-bold">ファイルをアップロード</span>
              <span className="text-xs opacity-80">(.txt, .md, .pdf)</span>
              <input
                type="file"
                accept=".txt,.md,.pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          ) : (
            // テキストエディタモード - 横並びレイアウト
            <div className="flex gap-3 items-end">
              {/* テンプレート選択 */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  📋 テンプレート
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">-- 空白から始める --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ファイル名入力 */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  📝 ファイル名
                </label>
                <input
                  type="text"
                  value={editorFilename}
                  onChange={(e) => setEditorFilename(e.target.value)}
                  placeholder="例: booth_A01_info"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {uploadStatus && (
            <div className="mt-3 text-center text-sm font-medium">{uploadStatus}</div>
          )}
        </div>

        {/* ドキュメント一覧 or ドキュメント内容表示 or テキストエディタ */}
        <div className="flex-1 overflow-hidden px-4 py-3 flex flex-col">
          {isTextMode ? (
            // テキストエディタ表示（大きく）
            <div className="h-full flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs text-gray-500 flex items-center gap-4">
                  <span>{editorText.length} 文字</span>
                  <span>Markdown形式で記述できます</span>
                </div>
                <button
                  onClick={handleTextUpload}
                  disabled={isLoading || !editorText.trim() || !editorFilename.trim()}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-md hover:shadow-lg"
                >
                  {isLoading ? "追加中..." : "RAGに追加"}
                </button>
              </div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="ここにテキストを入力するか、上のテンプレートを選択してください...&#10;&#10;展示会の他ブース情報などを追加して、来場者がAIチャットで質問できるようにしましょう！"
                className="flex-1 w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                disabled={isLoading}
                style={{ minHeight: "400px" }}
              />
            </div>
          ) : viewingDocument && documentContent ? (
            // ドキュメント内容表示
            <div className="h-full flex flex-col">
              {/* ヘッダー（固定） */}
              <div className="flex-shrink-0 pb-4 border-b border-gray-200">
                <button
                  onClick={closeDocumentView}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>一覧に戻る</span>
                </button>
                <h3 className="text-xl font-bold text-gray-900 mt-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {documentContent.filename}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  総チャンク数: {documentContent.total_chunks}
                  {searchQuery &&
                    ` | マッチ: ${documentContent.chunks.filter(chunkMatchesSearch).length}件`}
                </p>

                {/* 検索ボックス */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="キーワードで検索..."
                      className="flex-1 outline-none text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        type="button"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* チャンク一覧（スクロール可能） */}
              <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-4">
                {documentContent.chunks.filter(chunkMatchesSearch).map((chunk) => (
                  <div
                    key={chunk.chunk_index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                        チャンク {chunk.chunk_index + 1}
                      </span>
                      <span className="text-xs text-gray-500">{chunk.char_count} 文字</span>
                    </div>
                    <div
                      className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(chunk.content, searchQuery),
                      }}
                    />
                  </div>
                ))}
                {documentContent.chunks.filter(chunkMatchesSearch).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium">検索結果なし</p>
                    <p className="text-sm mt-2">
                      「{searchQuery}」に一致するチャンクが見つかりませんでした
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : isLoadingContent ? (
            // ローディング表示
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : documents.length === 0 ? (
            // ドキュメントがない場合
            <div className="text-center py-12 text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">ドキュメントがありません</p>
              <p className="text-sm mt-2">上のボタンからファイルをアップロードしてください</p>
            </div>
          ) : (
            // ドキュメント一覧
            <div className="space-y-3 overflow-y-auto h-full">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200 cursor-pointer"
                  onClick={() => fetchDocumentContent(doc.filename)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-5 h-5 text-blue-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="font-bold text-gray-900 truncate">{doc.filename}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {doc.file_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📊 {doc.chunk_count} チャンク</span>
                        <span>🕒 {new Date(doc.upload_timestamp).toLocaleString("ja-JP")}</span>
                      </div>
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        クリックして内容を表示 →
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.filename);
                      }}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all"
                      aria-label="削除"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            ヘッダーをドラッグで移動 | 右下をドラッグでサイズ変更
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium text-sm"
          >
            閉じる
          </button>
        </div>

        {/* リサイズハンドル */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onMouseDown={handleResizeStart}
          style={{
            background: "linear-gradient(135deg, transparent 50%, #cbd5e1 50%)",
          }}
        />
      </div>
    </div>
  );
}
