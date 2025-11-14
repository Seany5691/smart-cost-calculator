export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const toast = document.createElement('div');
  
  const bgColors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 ${bgColors[type]} px-6 py-3 rounded-lg shadow-lg z-[9999] animate-slide-up border-2 max-w-md`;
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-lg">${icons[type]}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 20px)';
      toast.style.transition = 'all 0.3s ease-in';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }, 3000);
};
