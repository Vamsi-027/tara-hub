/**
 * Auth Service Factory
 * Returns the appropriate auth service based on configuration
 */

import { IAuthService } from "./auth-service.interface";
import { NextAuthService } from "./nextauth-service";
// import { NestJSAuthService } from "./nestjs-service"; // Uncomment when migrating

// Export types
export * from "./auth-service.interface";

// Determine which auth service to use
const AUTH_PROVIDER = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'nextauth';

// Factory function to get the appropriate auth service
function getAuthService(): IAuthService {
  switch (AUTH_PROVIDER) {
    case 'nestjs':
      // When ready to migrate, uncomment this:
      // return new NestJSAuthService();
      throw new Error('NestJS auth service not yet implemented');
    case 'nextauth':
    default:
      return new NextAuthService();
  }
}

// Export singleton instance
export const authService = getAuthService();

// Export specific implementations for direct use if needed
export { NextAuthService } from "./nextauth-service";
// export { NestJSAuthService } from "./nestjs-service"; // Uncomment when ready