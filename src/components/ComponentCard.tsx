import { useState, useEffect } from 'react';
import type { GeneratedComponent } from '../types';
import { LivePreview } from './LivePreview';
import { CodeView } from './CodeView';

interface ComponentCardProps {
  component: GeneratedComponent;
  onRemove: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  streamingCode?: string;
}

type Tab = 'preview' | 'code';

export function ComponentCard({
  component,
  onRemove,
  onRegenerate,
  isLoading,
  isStreaming = false,
  streamingCode = '',
}: ComponentCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (isStreaming) {
      setActiveTab('code');
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming && streamingCode) {
      const timer = setTimeout(() => {
        setActiveTab('preview');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, streamingCode]);

  const createdAt = component.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayCode = isStreaming ? streamingCode : component.code;

  return (
    <div className="component-card">
      <div className="card-header">
        <div className="card-title-group">
          <span>{createdAt}</span>
          <p className="card-prompt">{component.prompt}</p>
        </div>
        <div className="card-actions">
          <button
            className="btn-refresh"
            onClick={() => setPreviewKey((k) => k + 1)}
            title="미리보기 새로고침"
            aria-label="미리보기 새로고침"
            disabled={isStreaming}
          >
            ↻
          </button>
          <button
            className="btn-regenerate"
            onClick={() => onRegenerate(component.prompt)}
            disabled={isLoading || isStreaming}
          >
            {isLoading || isStreaming ? '생성 중...' : '재생성'}
          </button>
          <button
            className="btn-remove"
            onClick={() => onRemove(component.id)}
            disabled={isStreaming}
          >
            삭제
          </button>
        </div>
      </div>
      <div className="card-tabs">
        <button
          className={`tab ${activeTab === 'preview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
          disabled={isStreaming}
        >
          미리보기
        </button>
        <button
          className={`tab ${activeTab === 'code' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          코드
        </button>
      </div>
      <div className="card-content">
        {activeTab === 'preview' ? (
          <LivePreview key={previewKey} code={isStreaming ? '' : component.code} />
        ) : (
          <CodeView code={displayCode} />
        )}
      </div>
    </div>
  );
}
