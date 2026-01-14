"use client";

import React, { useState } from 'react';
import { Mail, Send, TestTube, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function RebrandingEmailsPage() {
  const [mode, setMode] = useState<'test' | 'single' | 'all'>('test');
  const [testEmail, setTestEmail] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmails = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {

      const body: any = { mode };

      if (mode === 'test') {
        if (!testEmail) {
          throw new Error('Please enter a test email address');
        }
        body.testEmail = testEmail;
      }

      if (mode === 'single') {
        if (!singleEmail) {
          throw new Error('Please enter an email address');
        }
        body.email = singleEmail;
        body.displayName = displayName || 'Valued Customer';
      }

      const response = await fetch('/api/admin/send-rebranding-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-10 h-10 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rebranding Email Campaign</h1>
              <p className="text-gray-600">Send Animate → IconicMe announcement emails</p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Mode</h2>

          <div className="space-y-3">
            <button
              onClick={() => setMode('test')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                mode === 'test'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <TestTube className="w-6 h-6 text-purple-600" />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900">Test Mode</div>
                <div className="text-sm text-gray-600">Send to a single test email</div>
              </div>
              {mode === 'test' && <CheckCircle className="w-6 h-6 text-purple-600" />}
            </button>

            <button
              onClick={() => setMode('single')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                mode === 'single'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Send className="w-6 h-6 text-purple-600" />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900">Single User Mode</div>
                <div className="text-sm text-gray-600">Send to a specific user</div>
              </div>
              {mode === 'single' && <CheckCircle className="w-6 h-6 text-purple-600" />}
            </button>

            <button
              onClick={() => setMode('all')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                mode === 'all'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <Users className="w-6 h-6 text-red-600" />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900">All Users Mode</div>
                <div className="text-sm text-red-600">⚠️ Send to ALL users in database</div>
              </div>
              {mode === 'all' && <CheckCircle className="w-6 h-6 text-red-600" />}
            </button>
          </div>
        </div>

        {/* Form Fields Based on Mode */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Email Details</h2>

          {mode === 'test' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          )}

          {mode === 'single' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {mode === 'all' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Warning: Bulk Email Operation</p>
                  <p className="text-sm text-red-800">
                    This will send the rebranding email to ALL users in your database.
                    Make sure you have tested the email first and have the proper Resend API limits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendEmails}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : mode === 'all'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            `Send ${mode === 'all' ? 'to All Users' : mode === 'single' ? 'to User' : 'Test Email'}`
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {result && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">{result.message}</p>
                {result.results && (
                  <div className="text-sm text-green-800 space-y-1">
                    <p>Total: {result.results.total}</p>
                    <p>Successful: {result.results.successful}</p>
                    <p>Failed: {result.results.failed}</p>
                    {result.results.errors && result.results.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold mb-1">Errors:</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(result.results.errors, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
