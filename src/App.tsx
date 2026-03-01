import React, { useRef, useEffect } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";

export function App() {
  const sessionIdentifier = "session-drkingbd";

  const agent = useAgent({
    agent: "ChatAgent",
    name: sessionIdentifier,
  });

  const { messages, input, handleInputChange, handleSubmit, status } = useAgentChat({
    agent,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isGenerating = status === "generating";

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 p-2 rounded-xl shadow-sm">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">V8 Edge Architect AI</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5 text-slate-500">
            <Bot className="w-20 h-20 text-slate-300 drop-shadow-sm" />
            <p className="text-lg font-medium text-slate-600">Secure WebSocket established. Awaiting prompt.</p>
            <div className="flex gap-3 text-sm">
              <span className="bg-white border border-slate-200 px-4 py-2 rounded-full text-slate-700 shadow-sm">"What is the weather in Paris?"</span>
              <span className="bg-white border border-slate-200 px-4 py-2 rounded-full text-slate-700 shadow-sm">"Calculate 5000 * 3"</span>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end space-x-3`}
            >
              {!isUser && (
                <div className="bg-orange-100 p-2.5 rounded-full mb-1 border border-orange-200">
                  <Bot className="w-5 h-5 text-orange-600" />
                </div>
              )}
              
              <div
                className={`max-w-[75%] px-5 py-4 rounded-2xl shadow-sm ${
                  isUser
                    ? "bg-slate-800 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  {message.content}
                </p>

                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {message.toolInvocations.map((tool) => (
                      <div key={tool.toolCallId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-700">
                        <div className="font-semibold text-slate-900 mb-2 flex items-center space-x-2">
                           <span className="text-blue-500">⚡ Executing tool:</span>
                           <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">{tool.toolName}</span>
                        </div>
                        <div className="text-xs text-slate-500 overflow-x-auto bg-slate-100 p-2 rounded-lg">
                           Input: {JSON.stringify(tool.args)}
                        </div>
                        {'result' in tool && (
                          <div className="text-xs text-green-700 mt-2 overflow-x-auto bg-green-50 p-2 rounded-lg border border-green-100">
                            Result: {JSON.stringify(tool.result)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="bg-slate-200 p-2.5 rounded-full mb-1 border border-slate-300">
                  <User className="w-5 h-5 text-slate-700" />
                </div>
              )}
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex justify-start items-end space-x-3">
            <div className="bg-orange-100 p-2.5 rounded-full mb-1 border border-orange-200">
               <Bot className="w-5 h-5 text-orange-600" />
            </div>
            <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-3">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              <span className="text-sm text-slate-500 font-medium tracking-wide">Evaluating context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t border-slate-200 p-5 shrink-0 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              handleSubmit(e);
            }
          }}
          className="max-w-5xl mx-auto relative flex items-center shadow-sm rounded-full bg-slate-50 border border-slate-300 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Command the AI Agent..."
            className="w-full bg-transparent pl-6 pr-16 py-4 focus:outline-none text-slate-800 font-medium placeholder:font-normal placeholder-slate-400"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-10 w-10 shadow-sm"
            aria-label="Send query"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
