'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
      
      {/* Animated orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '4s' }}></div>
      
      {/* Additional floating orbs for depth */}
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-float" style={{ animationDelay: '3s' }}></div>
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
    </div>
  );
}
