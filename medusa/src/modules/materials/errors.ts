export class MaterialsServiceError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status = 500) {
    super(message)
    this.name = "MaterialsServiceError"
    this.code = code
    this.status = status
  }
}

export class InvalidMaterialError extends MaterialsServiceError {
  constructor(message: string) {
    super("INVALID_MATERIAL", message, 400)
  }
}

export class MaterialNotFoundError extends MaterialsServiceError {
  constructor(id: string) {
    super("MATERIAL_NOT_FOUND", `Material with ID '${id}' not found`, 404)
  }
}

export class MaterialsQueryError extends MaterialsServiceError {
  constructor(message: string) {
    super("QUERY_FAILED", message, 500)
  }
}

