import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export function resolveContainer<T>(
  scope: { resolve: (key: any) => T },
  key: keyof typeof ContainerRegistrationKeys,
  fallback: any
): T {
  const registration = (ContainerRegistrationKeys as any)[key]
  try {
    return scope.resolve(registration ?? fallback)
  } catch (error) {
    if (registration && registration !== fallback) {
      // retry with fallback if the registration constant is unavailable
      return scope.resolve(fallback)
    }
    throw error
  }
}
