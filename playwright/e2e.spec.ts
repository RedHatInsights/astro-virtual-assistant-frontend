import { expect, Page, test } from '@playwright/test';
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
interface AssistantConfig {
  isArhEnabled: boolean;
  isArhAuthenticated: boolean;
  isVaEnabled: boolean;
  isHccAiEnabled: boolean;
  isMasEnabled: boolean;
}

function detectEnabledAssistants(page: Page): Promise<AssistantConfig> {
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
    let isHccAiEnabled = false;
    let isMasEnabled = false;

    // Process feature flags response
    if (featureFlagsResponse) {
      try {
        const flags = (await featureFlagsResponse.json()) as FeatureFlagsResponse;
        const findFlag = (name: string) => flags?.toggles?.find((t) => t.name === name)?.enabled || false;
        isArhEnabled = findFlag('platform.arh.enabled');
        isVaEnabled = findFlag('platform.chatbot.va.enabled');
        isHccAiEnabled = findFlag('platform.chatbot.hcc-ai-assistant.enabled');
        isMasEnabled = findFlag('platform.chatbot.mas.enabled');
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Process ARH auth response
    if (arhAuthResponse) {
      isArhAuthenticated = arhAuthResponse.ok();
    }

    return { isArhEnabled, isArhAuthenticated, isVaEnabled, isHccAiEnabled, isMasEnabled };
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
    // The model selection toggle is only rendered when ≥2 AI managers are
    // available (see UniversalAssistantSelection).  Each manager has its own
    // feature-flag and/or auth gate, so in environments where most flags are
    // disabled the toggle may legitimately not appear.

    // Count managers that should be available based on detected flags/auth
    const isArhAvailable = assistantConfig.isArhEnabled && assistantConfig.isArhAuthenticated;
    const expectedManagers: string[] = [];
    if (assistantConfig.isVaEnabled) {
      // VA enabled path: VA, ARH (order depends on arh-default), HCC AI, MAS, RHEL
      expectedManagers.push('Hybrid Cloud Console'); // VA always available when flag on
      if (isArhAvailable) expectedManagers.push('Ask Red Hat');
      if (assistantConfig.isHccAiEnabled) expectedManagers.push('HCC AI Assistant');
      if (assistantConfig.isMasEnabled) expectedManagers.push('Multi-Agent System');
    } else {
      // VA disabled path: HCC AI, MAS, ARH, RHEL
      if (assistantConfig.isHccAiEnabled) expectedManagers.push('HCC AI Assistant');
      if (assistantConfig.isMasEnabled) expectedManagers.push('Multi-Agent System');
      if (isArhAvailable) expectedManagers.push('Ask Red Hat');
    }

    // Step 4: Verify model selection (only when ≥2 managers make the toggle visible)
    const modelSelectionToggle = page.locator(SELECTORS.modelToggle);
    const isToggleVisible = await modelSelectionToggle.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (isToggleVisible && expectedManagers.length > 0) {
      const expectedDefault = expectedManagers[0];
      await expect(modelSelectionToggle).toContainText(expectedDefault);

      // Open dropdown to verify the selected option
      await modelSelectionToggle.click();
      const selectedOption = page.locator(SELECTORS.selectedOption);
      await expect(selectedOption).toContainText(expectedDefault);

      // Close the dropdown
      await page.keyboard.press('Escape');
    }

    // Step 5: Close the virtual assistant
    const closeButton = page.locator(SELECTORS.closeButton);
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Step 6: Confirm that the virtual assistant has been closed
    await expect(chatbot).not.toBeVisible();
    await expect(assistantToggle).toBeVisible();
  });
});
