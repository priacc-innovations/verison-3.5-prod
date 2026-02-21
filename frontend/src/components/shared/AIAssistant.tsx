import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AIAssistantProps {
  userRole: string;
}

export default function AIAssistant({ userRole }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'ai'; content: string }>
  >([
    {
      role: 'ai',
      content: `Hello! I'm your AI assistant for MAMA. I can help you with attendance insights, performance analysis, and answer questions about your ${userRole} dashboard. How can I assist you today?`,
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);

    setTimeout(() => {
      let response = '';
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes('attendance')) {
        response =
          "Based on your attendance data, you've been 95% punctual this month with 2 late logins. Your consistency has improved by 10% compared to last month. Keep up the great work!";
      } else if (lowerInput.includes('performance')) {
        response =
          'Your weekly performance has shown steady improvement. Your average rating is 4.2/5, and your task completion rate is 92%. Your behavior score is excellent at 4.5/5.';
      } else if (lowerInput.includes('leave')) {
        response =
          'Based on your workload and attendance pattern, I suggest taking leave on Thursday and Friday next week. This will give you a long weekend and your projects have minimal deadlines during that period.';
      } else if (lowerInput.includes('salary') || lowerInput.includes('wallet')) {
        response =
          "Your current month earnings are on track. Based on your attendance, you've earned 85% of your monthly salary so far. No deductions for the last 3 weeks!";
      } else {
        response =
          'I can help you with attendance tracking, performance reviews, leave suggestions, and salary insights. What would you like to know more about?';
      }

      setMessages((prev) => [...prev, { role: 'ai', content: response }]);
    }, 1000);

    setInput('');
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14
        bg-gradient-to-br from-[#7A1CAC] to-[#AD49E1]
        rounded-full shadow-2xl flex items-center justify-center z-50
        hover:shadow-[#7A1CAC]/50 transition-shadow"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 z-50"
          >
            <Card glassmorphism className="overflow-hidden">
              {/* HEADER */}
              <div className="bg-gradient-to-r from-[#7A1CAC] to-[#AD49E1] p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-white/80">Powered by MAMA AI</p>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-[#EBD3F8]/40 dark:bg-[#2E073F]/40">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${
                      message.role === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[#7A1CAC] text-white'
                          : 'bg-white dark:bg-[#2E073F] text-gray-900 dark:text-[#EBD3F8] border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* INPUT */}
              <div className="p-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 focus:ring-[#7A1CAC]"
                  />
                  <Button
                    onClick={handleSend}
                    size="sm"
                    className="bg-[#7A1CAC] hover:bg-[#AD49E1]"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
