let socket
let socketModulePromise
let connectionVersion = 0

export async function connectSocket() {
  if (socket?.active) return socket
  const version = connectionVersion
  socketModulePromise ||= import('socket.io-client')
  let io
  try {
    ({ io } = await socketModulePromise)
  } catch (error) {
    socketModulePromise = undefined
    throw error
  }
  if (version !== connectionVersion) return undefined
  if (socket?.active) return socket
  socket?.disconnect()
  socket = io({ withCredentials: true })
  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  connectionVersion += 1
  socket?.disconnect()
  socket = undefined
}
