import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function testCronJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(`[test-cron-job] ran at ${new Date().toISOString()}`)
}

export const config = {
  name: "test-cron-job",
  schedule: "* * * * *",
}
