import { useState } from 'react';
import { X, Send, Bot, AlertTriangle } from 'lucide-react';

interface ChatbotModalProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: "Hello! I'm your AI wellness assistant. I can provide general wellness tips and home remedies. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const safeResponses: Record<string, string> = {
    'cold': "For a common cold, try these home remedies:\n\n• Stay hydrated with warm water, herbal tea, or soup\n• Get plenty of rest\n• Gargle with warm salt water for sore throat\n• Use a humidifier to ease congestion\n• Consider honey and ginger tea\n\nIf symptoms persist for more than a week or worsen, please consult a doctor.",
    'fever': "For mild fever:\n\n• Stay hydrated with water and electrolyte drinks\n• Rest in a cool room\n• Apply a cool compress to your forehead\n• Wear light clothing\n• Monitor your temperature regularly\n\n⚠️ Seek immediate medical attention if fever exceeds 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe symptoms.",
    'headache': "For headaches, try:\n\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead\n• Stay hydrated\n• Practice deep breathing exercises\n• Ensure proper sleep\n• Avoid bright screens\n\nIf headaches are severe, frequent, or accompanied by vision changes, seek medical attention.",
    'injury': "For minor injuries:\n\n• Clean the wound with clean water\n• Apply gentle pressure to stop bleeding\n• For bruises, apply ice wrapped in cloth\n• Keep the area clean and covered\n• Turmeric milk can help with healing and inflammation\n\n⚠️ For deep cuts, severe bleeding, or serious injuries, seek immediate medical attention.",
    'stress': "For stress management:\n\n• Practice deep breathing exercises\n• Try meditation or yoga\n• Get regular physical activity\n• Maintain a regular sleep schedule\n• Connect with friends and family\n• Consider journaling\n• Take breaks during work\n\nIf stress is overwhelming or affecting daily life, please consult a mental health professional.",
    'default': "I can provide general wellness advice on:\n\n• Common cold and flu\n• Minor injuries and first aid\n• Stress management\n• Sleep hygiene\n• Nutrition tips\n• Exercise guidance\n• Home remedies\n\n⚠️ Important: I cannot diagnose conditions or prescribe medications. For any serious symptoms or concerns, please consult a healthcare professional."
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const inputLower = input.toLowerCase();
      let response = safeResponses.default;

      if (inputLower.includes('cold') || inputLower.includes('cough')) {
        response = safeResponses.cold;
      } else if (inputLower.includes('fever') || inputLower.includes('temperature')) {
        response = safeResponses.fever;
      } else if (inputLower.includes('headache') || inputLower.includes('head pain')) {
        response = safeResponses.headache;
      } else if (inputLower.includes('injury') || inputLower.includes('wound') || inputLower.includes('cut')) {
        response = safeResponses.injury;
      } else if (inputLower.includes('stress') || inputLower.includes('anxiety') || inputLower.includes('worried')) {
        response = safeResponses.stress;
      }

      const botMessage: Message = {
        role: 'bot',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI Wellness Assistant</h2>
              <p className="text-sm text-gray-600">General health guidance & home remedies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Safety Notice</p>
            <p>This assistant provides general wellness information only. It cannot diagnose conditions, prescribe medications, or replace professional medical advice. For any health concerns, please consult a qualified healthcare provider.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about wellness tips, home remedies..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
