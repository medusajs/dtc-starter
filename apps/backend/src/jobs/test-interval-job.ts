import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function testIntervalJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(
    `[test-interval-job] ran at ${new Date().toISOString()} (uptime ${Math.round(process.uptime())}s)`
  )
}

export const config = {
  name: "test-interval-job",
  schedule: {
    interval: 120000,
  },
}
