import { Heart } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <Heart className="w-20 h-20 text-orange-500 fill-orange-500 animate-pulse" />
            <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30 animate-pulse"></div>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-3">SevaKey</h1>
        <p className="text-lg text-gray-600 mb-2">Secure Unified Key for Health Information</p>
        <p className="text-sm text-gray-500">Your health, your control</p>
      </div>
    </div>
  );
}
