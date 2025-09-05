import { loadEnv, defineConfig } from "@medusajs/framework/utils"
import path from "path"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// Worker mode configuration
const isWorkerMode = process.env.MEDUSA_WORKER_MODE === "worker"
const isServerMode = process.env.MEDUSA_WORKER_MODE === "server" || !process.env.MEDUSA_WORKER_MODE

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: isWorkerMode || process.env.DISABLE_MEDUSA_ADMIN === "true",
    path: "/app",
    outDir: process.env.MEDUSA_ADMIN_BUILD_PATH || path.resolve(process.cwd(), ".medusa/server/public/admin"),
    backendUrl: process.env.MEDUSA_BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "./src/modules/resend_notification",
      options: {
        api_key: process.env.RESEND_API_KEY,
        from_email: process.env.RESEND_FROM_EMAIL || "Tara Hub Admin <admin@deepcrm.ai>",
      },
    },
    {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl:
                process.env.GOOGLE_CALLBACK_URL ||
                "http://localhost:9000/auth/google/callback",
              successRedirect: "/app",
              admin: {
                successRedirect: "/app",
              },
              scope: ["email", "profile"],
            },
          },
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
            options: {},
          },
        ],
      },
    },
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET_NAME,
              endpoint: process.env.S3_ENDPOINT,
              s3ForcePathStyle: true,
              prefix: "store/organized/",
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/notification-sendgrid",
            id: "sendgrid",
            options: {
              apiKey: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM,
            },
          },
        ],
      },
    },
    { resolve: "./src/modules/contact" },
  ],
})
