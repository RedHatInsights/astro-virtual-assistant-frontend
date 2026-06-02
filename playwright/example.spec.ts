import { test, expect } from '@playwright/test';

/**
 * Virtual Assistant E2E Tests
 *
 * Tests the core functionality of the Virtual Assistant chatbot:
 * - Opening and closing the assistant
 * - Verifying default model selection
 * - Basic interaction flows
 *
 * Authentication is handled automatically via globalSetup from
 * @redhat-cloud-services/playwright-test-auth. The global setup
 * authenticates once and saves the session state, which all tests reuse.
 */

// Timeout for federated module loading (Virtual Assistant loads asynchronously)
const FEDERATED_MODULE_TIMEOUT = 15000;

test.describe('Virtual Assistant - E2E Tests', () => {
  test('should open and close the virtual assistant with correct default model', async ({ page }) => {
    // Navigate to the application
    // User is already authenticated via globalSetup
    await page.goto('/');

    // Step 1: Ensure virtual assistant is closed upon reaching the landing page
    // Note: VA loads as a federated module, so we need extended timeout
    const assistantToggle = page.locator('button[aria-label="Launch AI assistant"]');
    await expect(assistantToggle).toBeVisible({ timeout: FEDERATED_MODULE_TIMEOUT });

    // Verify chatbot is not visible initially
    const chatbot = page.locator('#ai-chatbot');
    await expect(chatbot).not.toBeVisible();

    // Step 2: Determine expected default based on feature flags and entitlements
    // Intercept the feature flags and ARH auth responses to determine which assistants are enabled
    let isArhEnabled = false;
    let isArhAuthenticated = false;

    // Listen for feature flag API calls
    page.on('response', async (response) => {
      if (response.url().includes('/api/featureflags')) {
        const flags = await response.json();
        isArhEnabled = flags?.toggles?.find((t: any) => t.name === 'platform.arh.enabled')?.enabled || false;
      }
      // Listen for ARH authentication check
      if (response.url().includes('access.redhat.com') || response.url().includes('access.stage.redhat.com')) {
        isArhAuthenticated = response.ok();
      }
    });

    // Step 3: Open the virtual assistant
    await assistantToggle.click();

    // Wait for chatbot to appear and for async managers to load
    await expect(chatbot).toBeVisible();

    // Step 4: Determine expected default model based on configuration
    // Default is the first available manager in order: ARH -> VA -> RHEL -> HCC AI -> Assisted Installer
    let expectedDefault = 'Hybrid Cloud Console'; // VA is always available (no flags/auth required)

    if (isArhEnabled && isArhAuthenticated) {
      expectedDefault = 'Ask Red Hat'; // ARH is first in the list
    }

    // Step 5: Verify the default model matches expected
    const modelSelectionToggle = page.locator('.universal-model-selection__toggle');
    await expect(modelSelectionToggle).toBeVisible();
    await expect(modelSelectionToggle).toContainText(expectedDefault);

    // Open dropdown to verify the selected option
    await modelSelectionToggle.click();
    const selectedOption = page.locator('[role="option"][aria-selected="true"]');
    await expect(selectedOption).toContainText(expectedDefault);

    // Close the dropdown
    await page.keyboard.press('Escape');

    // Step 4: Close the virtual assistant
    const closeButton = page.locator('button[aria-label="Close AI assistant"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Step 5: Confirm that the virtual assistant has been closed
    await expect(chatbot).not.toBeVisible();
    await expect(assistantToggle).toBeVisible();
  });
});
