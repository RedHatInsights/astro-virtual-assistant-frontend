import { expect, Page, Response, test } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';

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

// Timeouts
const FEDERATED_MODULE_TIMEOUT = 15000; // Virtual Assistant loads asynchronously
const API_RESPONSE_TIMEOUT = 10000; // Feature flags and auth API calls

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
 * Returns a promise that resolves after navigation triggers the API responses
 */
function detectEnabledAssistants(page: Page): Promise<{ isArhEnabled: boolean; isArhAuthenticated: boolean; isVaEnabled: boolean }> {
  // Wait for feature flags response
  const featureFlagsPromise = page.waitForResponse(
    (response) => response.url().includes('/api/featureflags'),
    { timeout: API_RESPONSE_TIMEOUT }
  ).catch(() => null);

  // Wait for ARH authentication check - specific endpoint only
  const arhAuthPromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      return (
        (url.includes('access.redhat.com') || url.includes('access.stage.redhat.com')) &&
        url.includes('/hydra/rest/contacts/sso/current') &&
        response.request().method() === 'GET'
      );
    },
    { timeout: API_RESPONSE_TIMEOUT }
  ).catch(() => null);

  // Return promise that processes responses when they arrive
  return Promise.all([featureFlagsPromise, arhAuthPromise]).then(async ([featureFlagsResponse, arhAuthResponse]) => {
    let isArhEnabled = false;
    let isArhAuthenticated = false;
    let isVaEnabled = false;

    // Process feature flags response
    if (featureFlagsResponse) {
      try {
        const flags = (await featureFlagsResponse.json()) as FeatureFlagsResponse;
        isArhEnabled = flags?.toggles?.find((t) => t.name === 'platform.arh.enabled')?.enabled || false;
        isVaEnabled = flags?.toggles?.find((t) => t.name === 'platform.chatbot.va.enabled')?.enabled || false;
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Process ARH auth response
    if (arhAuthResponse) {
      isArhAuthenticated = arhAuthResponse.ok();
    }

    return { isArhEnabled, isArhAuthenticated, isVaEnabled };
  });
}

test.describe('Virtual Assistant - E2E Tests', () => {
  test('should open and close the virtual assistant with correct default model', async ({ page }) => {
    // Block TrustArc cookie consent prompts to prevent flaky tests
    await disableCookiePrompt(page);

    // Set up response listeners BEFORE navigation to catch all API calls
    const detectionPromise = detectEnabledAssistants(page);

    // Navigate to the application to trigger API responses
    // User is already authenticated via globalSetup
    await page.goto('/');

    // Wait for API responses to determine configuration
    const assistantConfig = await detectionPromise;

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
    // When VA enabled: VA or ARH first (depends on arh-default flag)
    // When VA disabled: HCC AI > MAS > ARH fallback order
    let expectedDefault: string;

    if (assistantConfig.isVaEnabled) {
      // VA is available — it's the default unless arh-default moves ARH first
      expectedDefault = 'Hybrid Cloud Console';
      if (assistantConfig.isArhEnabled && assistantConfig.isArhAuthenticated) {
        // arh-default may make ARH the first; either way ARH is available
        expectedDefault = 'Ask Red Hat';
      }
    } else {
      // VA disabled — fallback priority: HCC AI, MAS, ARH
      expectedDefault = 'HCC AI Assistant';
      if (assistantConfig.isArhEnabled && assistantConfig.isArhAuthenticated) {
        // ARH is available but HCC AI is still first in priority
        expectedDefault = 'HCC AI Assistant';
      }
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
