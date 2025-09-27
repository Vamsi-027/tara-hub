import { InvalidMaterialError } from "./errors"
import type { ListOptions } from "./service"

export function validateListOptions(options: ListOptions): ListOptions {
  const out: ListOptions = {}

  if (options.limit !== undefined) {
    const n = Number(options.limit)
    if (!Number.isFinite(n)) throw new InvalidMaterialError("Limit must be a number")
    if (n < 1 || n > 100) throw new InvalidMaterialError("Limit must be between 1 and 100")
    out.limit = n
  }

  if (options.offset !== undefined) {
    const n = Number(options.offset)
    if (!Number.isFinite(n)) throw new InvalidMaterialError("Offset must be a number")
    if (n < 0) throw new InvalidMaterialError("Offset must be 0 or greater")
    out.offset = n
  }

  if (options.search !== undefined) {
    if (typeof options.search !== "string") {
      throw new InvalidMaterialError("Search must be a string")
    }
    const s = options.search.trim()
    if (s.length && s.length < 2) {
      throw new InvalidMaterialError("Search term must be at least 2 characters")
    }
    if (s.length > 100) {
      throw new InvalidMaterialError("Search term cannot exceed 100 characters")
    }
    // rudimentary character allowlist to avoid injection-y strings
    if (/[^\w\s\-]/.test(s)) {
      throw new InvalidMaterialError("Search term contains invalid characters")
    }
    if (s.length) out.search = s
  }

  if (options.filters) {
    out.filters = {}
    if ((options.filters as any).id !== undefined) {
      const id = String((options.filters as any).id).trim()
      if (!id) throw new InvalidMaterialError("filters.id cannot be empty")
      ;(out.filters as any).id = id
    }
    if (options.filters.name !== undefined) {
      if (typeof options.filters.name !== "string") {
        throw new InvalidMaterialError("filters.name must be a string")
      }
      const n = options.filters.name.trim()
      if (!n) throw new InvalidMaterialError("filters.name cannot be empty")
      out.filters.name = n
    }
  }

  return out
}

export function validateMaterialInput(input: { name: string; properties?: Record<string, unknown> }) {
  if (!input || typeof input !== "object") throw new InvalidMaterialError("Material payload is required")
  if (typeof input.name !== "string") throw new InvalidMaterialError("Material name must be a string")
  const name = input.name.trim()
  if (!name) throw new InvalidMaterialError("Material name cannot be empty")
  if (name.length > 255) throw new InvalidMaterialError("Material name cannot exceed 255 characters")
  const properties = input.properties ?? {}
  if (properties && typeof properties !== "object") {
    throw new InvalidMaterialError("Material properties must be an object")
  }
  return { name, properties }
}

export function validateId(id: unknown): string {
  if (typeof id !== "string") throw new InvalidMaterialError("Material ID is required")
  const v = id.trim()
  if (!v) throw new InvalidMaterialError("Material ID is required")
  return v
}
