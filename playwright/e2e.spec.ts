import { test, expect, Page } from '@playwright/test';

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

// Selectors
const SELECTORS = {
  launchButton: 'button[aria-label="Launch AI assistant"]',
  chatbot: '#ai-chatbot',
  modelToggle: '.universal-model-selection__toggle',
  selectedOption: '[role="option"][aria-selected="true"]',
  closeButton: 'button[aria-label="Close AI assistant"]',
} as const;

// Feature flag and auth detection
interface FeatureFlagToggle {
  name: string;
  enabled: boolean;
}

interface FeatureFlagsResponse {
  toggles?: FeatureFlagToggle[];
}

/**
 * Determines which AI assistants are enabled based on feature flags and authentication
 */
async function detectEnabledAssistants(page: Page): Promise<{ isArhEnabled: boolean; isArhAuthenticated: boolean }> {
  let isArhEnabled = false;
  let isArhAuthenticated = false;

  const responseHandler = async (response: Response) => {
    try {
      if (response.url().includes('/api/featureflags')) {
        const flags = (await response.json()) as FeatureFlagsResponse;
        isArhEnabled = flags?.toggles?.find((t) => t.name === 'platform.arh.enabled')?.enabled || false;
      }
      // Listen for ARH authentication check
      if (response.url().includes('access.redhat.com') || response.url().includes('access.stage.redhat.com')) {
        isArhAuthenticated = response.ok();
      }
    } catch (error) {
      // Ignore JSON parsing errors for non-JSON responses
    }
  };

  page.on('response', responseHandler);

  return { isArhEnabled, isArhAuthenticated };
}

test.describe('Virtual Assistant - E2E Tests', () => {
  test('should open and close the virtual assistant with correct default model', async ({ page }) => {
    // Set up response listeners BEFORE navigation to catch all API calls
    const assistantConfig = await detectEnabledAssistants(page);

    // Navigate to the application
    // User is already authenticated via globalSetup
    await page.goto('/');

    // Step 1: Ensure virtual assistant is closed upon reaching the landing page
    // Note: VA loads as a federated module, so we need extended timeout
    const assistantToggle = page.locator(SELECTORS.launchButton);
    await expect(assistantToggle).toBeVisible({ timeout: FEDERATED_MODULE_TIMEOUT });

    // Verify chatbot is not visible initially
    const chatbot = page.locator(SELECTORS.chatbot);
    await expect(chatbot).not.toBeVisible();

    // Step 2: Open the virtual assistant
    await assistantToggle.click();

    // Wait for chatbot to appear and for async managers to load
    await expect(chatbot).toBeVisible();

    // Step 3: Determine expected default model based on configuration
    // Default is the first available manager in order: ARH -> VA -> RHEL -> HCC AI -> Assisted Installer
    let expectedDefault = 'Hybrid Cloud Console'; // VA is always available (no flags/auth required)

    if (assistantConfig.isArhEnabled && assistantConfig.isArhAuthenticated) {
      expectedDefault = 'Ask Red Hat'; // ARH is first in the list
    }

    // Step 4: Verify the default model matches expected
    const modelSelectionToggle = page.locator(SELECTORS.modelToggle);
    await expect(modelSelectionToggle).toBeVisible();
    await expect(modelSelectionToggle).toContainText(expectedDefault);

    // Open dropdown to verify the selected option
    await modelSelectionToggle.click();
    const selectedOption = page.locator(SELECTORS.selectedOption);
    await expect(selectedOption).toContainText(expectedDefault);

    // Close the dropdown
    await page.keyboard.press('Escape');

    // Step 5: Close the virtual assistant
    const closeButton = page.locator(SELECTORS.closeButton);
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Step 6: Confirm that the virtual assistant has been closed
    await expect(chatbot).not.toBeVisible();
    await expect(assistantToggle).toBeVisible();
  });
});
