import { useState, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { aiApi } from '../../api/apiService';

const SUGGESTIONS = [
  'How can I save more money?',
  'Show me a summary of my expenses.',
  'Suggest a budget for next month.',
  'What are my top spending categories?',
  'Forecast my expenses for next quarter.'
];

const EXPENSE_CATEGORIES = [
  { label: 'All Expenses', query: 'Show me all my expenses for this month.' },
  { label: 'Employee Expenses', query: 'Show me my employee expenses for this month.' },
  { label: 'Vendor Payments', query: 'Show me my vendor payments for this month.' },
  { label: 'Salary Expenses', query: 'Show me my salary expenses for this month.' },
];

export default function AIBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Show summary when widget opens
  useEffect(() => {
    if (isOpen && history.length === 0) {
      setLoading(true);
      aiApi.ask('Show me a summary of my income and expenses.')
        .then(res => {
          const aiText = res?.data?.answer || res?.data?.message || 'AI response received.';
          setHistory([{ role: 'ai', text: aiText }]);
        })
        .catch((err) => {
          let msg = 'Sorry, I could not fetch your summary.';
          if (err?.response?.data?.error?.includes('quota') || err?.response?.data?.error?.includes('limit')) {
            msg = 'AI service unavailable: quota exceeded. Please check your API key or try again later.';
          }
          setHistory([{ role: 'ai', text: msg }]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setHistory(h => [...h, { role: 'user', text: input }]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      // Streaming response
      let aiText = '';
      await aiApi.ask(input, history, { stream: true }).then((streamed) => {
        aiText = streamed;
      });
      setHistory(h => [...h, { role: 'ai', text: aiText }]);
    } catch (err) {
      let msg = 'Sorry, I could not process your request.';
      if (err?.response?.data?.error?.includes('quota') || err?.response?.data?.error?.includes('limit')) {
        msg = 'AI service unavailable: quota exceeded. Please check your API key or try again later.';
      }
      setError('AI service error.');
      setHistory(h => [...h, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 mb-2 p-4 flex flex-col">
          <div className="flex items-center mb-2">
            <SparklesIcon className="w-6 h-6 text-indigo-500 mr-2" />
            <span className="font-semibold text-lg text-gray-800 dark:text-white">AI Assistant</span>
          </div>
          {/* Expense Category Quick Select */}
          <div className="flex flex-wrap gap-2 mb-2">
            {EXPENSE_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={async () => {
                  setLoading(true);
                  setHistory(h => [...h, { role: 'user', text: cat.label }]);
                  setInput('');
                  setError(null);
                  try {
                    let aiText = '';
                    await aiApi.ask(cat.query, history, { stream: true }).then((streamed) => {
                      aiText = streamed;
                    });
                    setHistory(h => [...h, { role: 'ai', text: aiText }]);
                  } catch (err) {
                    setError('AI service error. Please try again.');
                    setHistory(h => [...h, { role: 'ai', text: 'Sorry, I could not process your request.' }]);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-700 transition"
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => handleSuggestion(s)} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-100 rounded text-xs hover:bg-indigo-200 dark:hover:bg-indigo-700 transition">{s}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto mb-2 max-h-40">
            {history.length === 0 && (
              <div className="text-gray-400 text-sm">Ask me anything about your finances!</div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`my-1 text-sm ${msg.role === 'user' ? 'text-right text-indigo-700' : 'text-left text-gray-700 dark:text-gray-200'}`}>{msg.text}</div>
            ))}
            {loading && <div className="text-xs text-gray-400 mt-2">AI is typing...</div>}
            {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 flex items-center" disabled={loading}>
              <PaperAirplaneIcon className="w-4 h-4 mr-1" /> Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg p-3 flex items-center justify-center focus:outline-none"
        aria-label="Open AI Assistant"
      >
        <SparklesIcon className="w-6 h-6" />
      </button>
    </div>
  );
}