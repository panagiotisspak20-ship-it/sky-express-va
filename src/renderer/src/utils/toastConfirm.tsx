import toast from 'react-hot-toast'

/**
 * A promise-based replacement for window.confirm() using react-hot-toast
 * to prevent blocking native OS dialogs which can steal focus in Electron.
 */
export const toastConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 font-tahoma w-64">
          <span className="font-bold text-sm text-gray-800 whitespace-pre-wrap">{message}</span>
          <div className="flex gap-2 justify-end">
            <button
              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
              onClick={() => {
                toast.dismiss(t.id)
                resolve(false)
              }}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-bold transition-colors"
              onClick={() => {
                toast.dismiss(t.id)
                resolve(true)
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: `confirm-${Date.now()}` }
    )
  })
}
