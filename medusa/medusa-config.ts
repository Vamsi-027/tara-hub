import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
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
              callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:9000/auth/google/callback",
              successRedirect: "/app",
              admin: {
                successRedirect: "/app",
              },
              scope: ["email", "profile"]
            }
          },
          // Keep emailpass as fallback for initial setup
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
            options: {
              // This will be used for initial admin setup only
            }
          }
        ]
      }
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
              // Organized folder structure - this will be prefixed to all uploads
              prefix: "store/organized/",
              // Additional S3 client configuration
              additional_client_config: {
                forcePathStyle: true
              }
            }
          }
        ]
      }
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
            }
          }
        ]
      }
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
            }
          }
        ]
      }
    }
  ]
})
