import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type RegistrationKey = keyof typeof ContainerRegistrationKeys | string | symbol

type ScopeLike = {
  resolve: (key: any) => any
}

export function resolveContainer<T>(
  scope: ScopeLike,
  key: RegistrationKey,
  fallback?: any
): T {
  const registration =
    typeof key === "string"
      ? (ContainerRegistrationKeys as any)[key]
      : (ContainerRegistrationKeys as any)[key as keyof typeof ContainerRegistrationKeys]

  const primary = registration ?? key

  try {
    const resolved = scope.resolve(primary)
    if (resolved !== undefined && resolved !== null) {
      return resolved
    }
  } catch (error) {
    if (!fallback || fallback === primary) {
      throw error
    }
  }

  if (fallback !== undefined && fallback !== primary) {
    return scope.resolve(fallback)
  }

  return scope.resolve(primary)
}
