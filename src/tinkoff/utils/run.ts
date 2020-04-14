export const run = async <T>(cb: () => Promise<T>) => {
  try {
    const res = await cb()
    return res
  } catch (error) {
    console.error(error)
  }
}
