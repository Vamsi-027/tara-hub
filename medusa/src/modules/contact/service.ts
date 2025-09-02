import { MedusaService } from "@medusajs/framework/utils"
import Contact from "./models/contact"

class ContactModuleService extends MedusaService({
  Contact
}) {}

export default ContactModuleService