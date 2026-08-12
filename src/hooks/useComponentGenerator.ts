import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider, StreamingState } from '../types';
import { loadComponents, saveComponents } from '../utils/componentStorage';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  streamingComponent: StreamingState | null;
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(() => loadComponents());
  const [streamingComponent, setStreamingComponent] = useState<StreamingState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveComponents(components);
  }, [components]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const componentId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      const res = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to generate component');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedCode = '';

      setStreamingComponent({
        id: componentId,
        prompt,
        code: '',
        isStreaming: true,
        createdAt: new Date(),
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (!data) continue;

            try {
              const event = JSON.parse(data) as {
                chunk?: string;
                isComplete?: boolean;
                error?: string;
              };

              if (event.error) {
                throw new Error(event.error);
              }

              if (event.chunk !== undefined) {
                accumulatedCode += event.chunk;
                setStreamingComponent((prev) =>
                  prev
                    ? {
                        ...prev,
                        code: accumulatedCode,
                        isStreaming: !event.isComplete,
                      }
                    : null
                );

                if (event.isComplete) {
                  const finalCode = accumulatedCode;
                  const newComponent: GeneratedComponent = {
                    id: componentId,
                    prompt,
                    code: finalCode,
                    createdAt: new Date(),
                  };

                  setComponents((prev) => [newComponent, ...prev]);
                  setStreamingComponent(null);
                }
              }
            } catch (err) {
              throw new Error(`Failed to parse event: ${err}`);
            }
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data) {
          try {
            const event = JSON.parse(data) as {
              chunk?: string;
              isComplete?: boolean;
              error?: string;
            };

            if (event.error) {
              throw new Error(event.error);
            }

            if (event.chunk !== undefined) {
              accumulatedCode += event.chunk;
              setStreamingComponent((prev) =>
                prev
                  ? {
                      ...prev,
                      code: accumulatedCode,
                      isStreaming: !event.isComplete,
                    }
                  : null
              );

              if (event.isComplete) {
                const finalCode = accumulatedCode;
                const newComponent: GeneratedComponent = {
                  id: componentId,
                  prompt,
                  code: finalCode,
                  createdAt: new Date(),
                };

                setComponents((prev) => [newComponent, ...prev]);
                setStreamingComponent(null);
              }
            }
          } catch (err) {
            throw new Error(`Failed to parse final event: ${err}`);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStreamingComponent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, streamingComponent, isLoading, error, generate, removeComponent, clearAll };
}
