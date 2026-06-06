import { type Page, type Locator, expect } from '@playwright/test'

/**
 * BasePage — shared foundation for all Playwright Page Object Models.
 *
 * Extend this class for route-specific page objects. Provides common
 * navigation, wait, and verification helpers used across the test suite.
 *
 * Follows the Page Object pattern from the Playwright skill:
 * - Locator definitions in constructor
 * - Action methods that compose locator interactions
 * - Assertion/verification methods that use expect()
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a path relative to baseURL and wait for network idle.
   * Use this instead of raw page.goto() in page objects.
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Wait for the page to finish loading (network idle).
   * Call after navigation or actions that trigger route changes.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Assert the current page URL matches the expected path.
   */
  async expectUrl(path: string): Promise<void> {
    await expect(this.page).toHaveURL(path)
  }

  /**
   * Assert an element with the given role and name is visible.
   */
  async expectHeading(
    level: 1 | 2 | 3 | 4 | 5 | 6,
    name: string | RegExp,
  ): Promise<void> {
    await expect(
      this.page.getByRole('heading', { level, name }),
    ).toBeVisible()
  }

  /**
   * Assert a button with the given accessible name is visible.
   */
  async expectButton(name: string | RegExp): Promise<Locator> {
    const button = this.page.getByRole('button', { name })
    await expect(button).toBeVisible()
    return button
  }

  /**
   * Assert a textbox/input with the given accessible label is visible.
   */
  async expectTextbox(name: string | RegExp): Promise<Locator> {
    const textbox = this.page.getByRole('textbox', { name })
    await expect(textbox).toBeVisible()
    return textbox
  }

  /**
   * Get the current page URL as a string.
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url()
  }
}
