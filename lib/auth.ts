export const saveToken = (t: string) => {
  if (typeof window !== "undefined") localStorage.setItem("token", t)
}
export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null
export const clearToken = () => {
  if (typeof window !== "undefined") localStorage.removeItem("token")
}