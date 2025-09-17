/*
  Product Import Batch Job Subscriber

  Handles batch job events for product imports
*/

import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function productImportSubscriber({
  event,
  container,
}: SubscriberArgs) {
  const batchJob = event.data;

  // Only handle product-import jobs
  if (batchJob.type !== "product-import") {
    return;
  }

  console.log(`[ProductImportSubscriber] Processing job ${batchJob.id} with status ${batchJob.status}`);

  try {
    // Import and execute the handler
    const handler = await import("../jobs/product-import");
    await handler.default(batchJob, container);

    // Mark job as completed
    const batchJobService = container.resolve("batchJobService");
    await batchJobService.complete(batchJob.id);
  } catch (error) {
    console.error(`[ProductImportSubscriber] Job failed:`, error);
    const batchJobService = container.resolve("batchJobService");
    await batchJobService.setFailed(
      batchJob.id,
      error instanceof Error ? error.message : "Processing failed"
    );
  }
}

export const config: SubscriberConfig = {
  event: "batch.confirmed",
  context: {
    subscriberId: "product-import-subscriber",
  },
};