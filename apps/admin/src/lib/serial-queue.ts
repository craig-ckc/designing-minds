export function enqueueSerial(queue: { current: Promise<void> }, task: () => Promise<void>): Promise<void> {
  const result = queue.current.then(task)
  queue.current = result.catch(() => {})
  return result
}
