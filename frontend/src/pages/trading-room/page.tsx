'use client';

import { useState, useEffect } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { TradingDashboard } from '@/components/trading/TradingDashboard';
import { useTradingStore } from '@/stores/trading-store';

export default function TradingRoomPage() {
  const [messages, setMessages] = useState<{ user: string; text: string; timestamp: number }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState<string[]>(['You', 'Trader_2', 'Trader_3']);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        user: 'You',
        text: newMessage,
        timestamp: Date.now()
      }]);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
        {/* Main Trading Area */}
        <div className="lg:col-span-3">
          <TradingDashboard />
        </div>

        {/* Trading Room Sidebar */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Trading Room</h2>
          </div>

          {/* Active Users */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Active Traders ({activeUsers.length})</h3>
            <div className="space-y-2">
              {activeUsers.map((user, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    user === 'You' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-white text-sm">{user}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-400">Live Chat</h3>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 h-64 mb-3 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="text-blue-400 text-sm font-medium">{msg.user}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{msg.text}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm text-center">No messages yet</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}