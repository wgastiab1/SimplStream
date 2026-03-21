interface ConfirmDeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'light' | 'dark';
  title: string;
}


export function ConfirmDeleteModal({ onConfirm, onCancel, theme, title }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 4k:p-8">
      <div
        className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl 4k:rounded-[3rem] p-8 4k:p-16 max-w-md 4k:max-w-4xl w-full shadow-2xl relative`}
        style={{
          boxShadow: theme === 'dark'
            ? '0 0 60px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.3)'
            : '0 0 60px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.4)',
        }}
      >
        <h2 className={`text-2xl 4k:text-6xl font-bold mb-4 4k:mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Confirm Delete
        </h2>
        <p className={`mb-8 4k:mb-16 text-lg 4k:text-4xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Are you sure you want to delete "{title}"?
        </p>
        <div className="flex gap-4 4k:gap-8">
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 4k:px-12 4k:py-6 4k:text-3xl bg-red-600 hover:bg-red-700 text-white rounded-lg 4k:rounded-2xl font-medium transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 px-6 py-3 4k:px-12 4k:py-6 4k:text-3xl ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'} rounded-lg 4k:rounded-2xl font-medium transition-colors`}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}


