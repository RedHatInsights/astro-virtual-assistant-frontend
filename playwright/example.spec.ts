import { test, expect } from '@playwright/test';

/**
 * Virtual Assistant E2E Tests
 *
 * Tests the core functionality of the Virtual Assistant chatbot:
 * - Opening and closing the assistant
 * - Verifying default model selection
 * - Basic interaction flows
 */

test.describe('Virtual Assistant - E2E Tests', () => {
  test('should open and close the virtual assistant with correct default model', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Step 1: Ensure virtual assistant is closed upon reaching the landing page
    const assistantToggle = page.locator('button[aria-label="Launch AI assistant"]');
    await expect(assistantToggle).toBeVisible();

    // Verify chatbot is not visible initially
    const chatbot = page.locator('#ai-chatbot');
    await expect(chatbot).not.toBeVisible();

    // Step 2: Open the virtual assistant
    await assistantToggle.click();

    // Wait for chatbot to appear
    await expect(chatbot).toBeVisible();

    // Step 3: Confirm that the selected assistant is the appropriate value in the dropdown
    // The default model should be "Ask Red Hat" with selection title "General Red Hat (Default)"
    const modelSelectionToggle = page.locator('.universal-model-selection__toggle');
    await expect(modelSelectionToggle).toBeVisible();
    await expect(modelSelectionToggle).toContainText('General Red Hat (Default)');

    // Optional: Open dropdown to verify the selected option
    await modelSelectionToggle.click();
    const selectedOption = page.locator('[role="option"][aria-selected="true"]');
    await expect(selectedOption).toContainText('General Red Hat (Default)');

    // Close the dropdown
    await page.keyboard.press('Escape');

    // Step 4: Close the virtual assistant
    const closeButton = page.locator('.pf-chatbot__header-actions button[aria-label*="Close"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Step 5: Confirm that the virtual assistant has been closed
    await expect(chatbot).not.toBeVisible();
    await expect(assistantToggle).toBeVisible();
  });
});
