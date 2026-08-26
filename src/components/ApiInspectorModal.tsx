import React, { useState, useEffect } from 'react';
import { X, Server, Send, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiInspectorModal: React.FC<ApiInspectorModalProps> = ({ isOpen, onClose }) => {
  const [routes, setRoutes] = useState<{ method: string; path: string; description: string }[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/health');
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getApiRoutes()
        .then((res) => {
          if (res.endpoints) setRoutes(res.endpoints);
        })
        .catch(() => {});
      // Auto trigger health test
      triggerTest('/api/health');
    }
  }, [isOpen]);

  const triggerTest = async (endpointPath: string) => {
    setSelectedEndpoint(endpointPath);
    setLoading(true);
    setResponseOutput('Sending request to Node.js / Express backend...');
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const startTime = performance.now();
      const res = await fetch(endpointPath, { headers });
      const duration = Math.round(performance.now() - startTime);

      setResponseStatus(res.status);
      const data = await res.json().catch(() => ({ raw: 'Non-json response' }));

      setResponseOutput(
        JSON.stringify(
          {
            _debugInfo: {
              status: res.status,
              statusText: res.statusText,
              latency: `${duration}ms`,
              authHeaderPresent: !!token,
            },
            data,
          },
          null,
          2
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setResponseStatus(500);
      setResponseOutput(JSON.stringify({ error: msg }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="api-inspector-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="api-inspector-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Node.js Backend REST API Inspector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live interactive testing console for Express & JWT endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Quick Endpoint Trigger Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Test Endpoint:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { method: 'GET', path: '/api/health', label: 'Health & Runtime Info' },
                { method: 'GET', path: '/api/auth/me', label: 'Authenticated User Profile' },
                { method: 'GET', path: '/api/tasks', label: 'Fetch Tasks List (JWT)' },
                { method: 'GET', path: '/api/stats', label: 'Productivity Analytics' },
              ].map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => triggerTest(ep.path)}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    selectedEndpoint === ep.path
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-bold block text-slate-800 dark:text-slate-200">
                      {ep.label}
                    </span>
                    <code className="text-[10px] text-slate-500 font-mono">{ep.path}</code>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {ep.method}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Response Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Response Payload</span>
                {responseStatus && (
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      responseStatus < 300 ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-[11px] overflow-x-auto max-h-48 leading-relaxed text-emerald-400">
              {loading ? 'Processing request...' : responseOutput}
            </pre>
          </div>

          {/* All API Directory */}
          {routes.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                Full Backend Route Catalog ({routes.length} endpoints):
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                {routes.map((r, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.description}
                      </span>
                      <code className="text-[10px] text-slate-400 block font-mono mt-0.5">{r.path}</code>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.method === 'GET'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                          : r.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : r.method === 'DELETE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}
                    >
                      {r.method}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
