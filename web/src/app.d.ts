import type { D1Database } from '@maple-cpi/shared';

declare global {
  namespace App {
    interface Platform {
      env?: {
        DB: D1Database;
      };
    }
  }
}

export {};
