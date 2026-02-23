// Simple toast utility - replace with a proper toast library like sonner later
export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message)
    alert(`Success: ${message}`)
  },
  error: (message: string) => {
    console.error('❌ Error:', message)
    alert(`Error: ${message}`)
  }
}