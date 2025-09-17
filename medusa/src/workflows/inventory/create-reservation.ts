import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { INVENTORY_MANAGEMENT } from "../../modules/inventory_management"

interface ReservationInput {
  inventory_item_id: string
  location_id: string
  quantity: number
  line_item_id?: string
  external_id?: string
  description?: string
  created_by?: string
  metadata?: Record<string, any>
  expires_at?: Date
}

const checkInventoryAvailabilityStep = createStep(
  "check-inventory-availability",
  async ({ inventory_item_id, location_id, quantity }: ReservationInput, { container }) => {
    const inventoryService = container.resolve(INVENTORY_MANAGEMENT)

    const levels = await inventoryService.listInventoryLevels({
      inventory_item_id,
      location_id,
    })

    if (!levels.length) {
      throw new Error(`No inventory level found for item ${inventory_item_id} at location ${location_id}`)
    }

    const level = levels[0]
    const available = level.available_quantity

    if (available < quantity) {
      throw new Error(`Insufficient inventory. Available: ${available}, Requested: ${quantity}`)
    }

    return new StepResponse({ available })
  }
)

const createReservationStep = createStep(
  "create-reservation",
  async (input: ReservationInput, { container }) => {
    const inventoryService = container.resolve(INVENTORY_MANAGEMENT)

    const reservation = await inventoryService.createReservation(input)

    return new StepResponse(reservation, reservation.id)
  },
  async (reservationId: string, { container }) => {
    // Compensation: Delete the reservation if something goes wrong
    const inventoryService = container.resolve(INVENTORY_MANAGEMENT)
    await inventoryService.deleteReservation(reservationId)
  }
)

export const createReservationWorkflow = createWorkflow(
  "create-inventory-reservation",
  (input: ReservationInput) => {
    // Step 1: Check availability
    checkInventoryAvailabilityStep(input)

    // Step 2: Create reservation
    const reservation = createReservationStep(input)

    return new WorkflowResponse(reservation)
  }
)