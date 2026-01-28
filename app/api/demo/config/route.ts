import { NextResponse } from "next/server";

/**
 * GET /api/demo/config
 * Returns configuration for the OSS version (no demo limits)
 */
export async function GET() {
  return NextResponse.json({
    config: {
      isDemoMode: false,
      appName: "Deposition Prep Tools",
      upgradeUrl: "https://case.dev",
      contactEmail: "sales@case.dev",
      demoExpiryDays: 0,
      features: {
        enableExport: true,
        enableBulkUpload: true,
        enableAdvancedSearch: true,
        enableCustomization: true,
        enableApiAccess: true,
      },
    },
    limits: {
      pricing: {
        sessionPriceLimit: Infinity,
        pricePerThousandChars: 0,
        sessionHours: 24,
      },
      documents: {
        maxDocumentsPerSession: Infinity,
        maxFileSize: Infinity,
      },
    },
    limitDescriptions: {},
    disabledFeatures: [],
  });
}
