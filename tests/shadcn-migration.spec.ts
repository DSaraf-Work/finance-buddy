import { test, expect } from '@playwright/test';

test.describe('shadcn/ui Migration Validation', () => {
  // Theme validation tests
  test.describe('Matte Dark Theme', () => {
    test('should apply correct background colors', async ({ page }) => {
      await page.goto('/');

      // Check main background color (#09090B)
      const body = page.locator('body');
      await expect(body).toHaveCSS('background-color', 'rgb(9, 9, 11)');

      // Check text color (#FAFAFA)
      const mainContent = page.locator('main').first();
      await expect(mainContent).toHaveCSS('color', 'rgb(250, 250, 250)');
    });

    test('should apply correct primary color to buttons', async ({ page }) => {
      await page.goto('/auth');

      // Check primary button color (#6366F1)
      const primaryButton = page.locator('button:has-text("Sign In")').first();
      if (await primaryButton.isVisible()) {
        await expect(primaryButton).toHaveCSS('background-color', 'rgb(99, 102, 241)');
      }
    });

    test('should maintain theme consistency across pages', async ({ page }) => {
      const pages = ['/', '/auth', '/help'];

      for (const path of pages) {
        await page.goto(path);
        const body = page.locator('body');
        await expect(body).toHaveCSS('background-color', 'rgb(9, 9, 11)');
      }
    });
  });

  // Component migration tests
  test.describe('shadcn/ui Components', () => {
    test('Card components should be rendered correctly', async ({ page }) => {
      await page.goto('/');

      // Check if Card components exist
      const cards = page.locator('[class*="rounded-"][class*="border"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // Verify card has proper border and background
        const firstCard = cards.first();
        const borderColor = await firstCard.evaluate(el =>
          window.getComputedStyle(el).borderColor
        );
        expect(borderColor).toBeTruthy();
      }
    });

    test('Button components should have proper styling', async ({ page }) => {
      await page.goto('/auth');

      // Check Button component classes
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          // Check for Tailwind classes
          const className = await button.getAttribute('class');
          expect(className).toContain('rounded');
          expect(className).toMatch(/px-\d+|py-\d+/);
        }
      }
    });

    test('Input components should be properly styled', async ({ page }) => {
      await page.goto('/auth');

      // Check Input components
      const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        const firstInput = inputs.first();
        await expect(firstInput).toHaveCSS('border-radius', /\d+px/);

        // Check dark theme input styling
        const bgColor = await firstInput.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).toBeTruthy();
      }
    });

    test('Table components should render correctly', async ({ page }) => {
      // Navigate to a page with tables if user is authenticated
      await page.goto('/');

      // Try to navigate to admin page to check tables
      const adminLink = page.locator('a[href="/admin"]').first();
      if (await adminLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await adminLink.click();
        await page.waitForLoadState('networkidle');

        const tables = page.locator('table');
        const tableCount = await tables.count();

        if (tableCount > 0) {
          const firstTable = tables.first();

          // Check for table header
          const thead = firstTable.locator('thead');
          await expect(thead).toBeVisible();

          // Check for proper table structure
          const th = thead.locator('th').first();
          if (await th.isVisible()) {
            const className = await th.getAttribute('class');
            expect(className).toContain('text-');
          }
        }
      }
    });
  });

  // Navigation tests
  test.describe('Navigation', () => {
    test('should navigate between main pages', async ({ page }) => {
      await page.goto('/');

      // Check if we're on the homepage
      await expect(page).toHaveTitle(/Finance Buddy/);

      // Navigate to auth page
      const authLink = page.locator('a[href="/auth"]').first();
      if (await authLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await authLink.click();
        await expect(page).toHaveURL(/auth/);
      }

      // Navigate to help page
      await page.goto('/help');
      await expect(page).toHaveURL(/help/);
    });

    test('should have functional navigation menu', async ({ page }) => {
      await page.goto('/');

      // Check for navigation elements
      const nav = page.locator('nav, header').first();
      if (await nav.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Verify navigation has proper dark theme
        const navBg = await nav.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(navBg).toBeTruthy();
      }
    });
  });

  // Responsive design tests
  test.describe('Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');

      // Check if content is visible and not overflowing
      const mainContent = page.locator('main').first();
      const isVisible = await mainContent.isVisible();
      expect(isVisible).toBeTruthy();

      // Check for horizontal scroll (should not exist)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('should be responsive on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Check if content adapts to tablet size
      const mainContent = page.locator('main').first();
      const isVisible = await mainContent.isVisible();
      expect(isVisible).toBeTruthy();
    });

    test('should be responsive on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');

      // Check if content is properly centered and constrained
      const mainContent = page.locator('main').first();
      if (await mainContent.isVisible()) {
        const box = await mainContent.boundingBox();
        if (box) {
          // Content should not be full width on large screens
          expect(box.width).toBeLessThan(1920);
        }
      }
    });
  });

  // Accessibility tests
  test.describe('Accessibility', () => {
    test('should have proper contrast ratios', async ({ page }) => {
      await page.goto('/');

      // Check text contrast against background
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6').first();
      if (await textElements.isVisible({ timeout: 5000 }).catch(() => false)) {
        const color = await textElements.evaluate(el =>
          window.getComputedStyle(el).color
        );

        // Text should be light color on dark background
        const rgb = color.match(/\d+/g);
        if (rgb) {
          const [r, g, b] = rgb.map(Number);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          expect(brightness).toBeGreaterThan(128); // Should be light text
        }
      }
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/auth');

      // Tab through interactive elements
      const firstInput = page.locator('input').first();
      if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstInput.focus();

        // Check for focus ring
        const focusRing = await firstInput.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.outline || styles.boxShadow;
        });
        expect(focusRing).toBeTruthy();
      }
    });

    test('should have semantic HTML structure', async ({ page }) => {
      await page.goto('/');

      // Check for semantic elements
      const main = page.locator('main');
      await expect(main).toHaveCount(1);

      // Check for proper heading hierarchy
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have at most one h1
    });
  });

  // Page-specific tests
  test.describe('Page-specific Features', () => {
    test('Auth page should have sign in form', async ({ page }) => {
      await page.goto('/auth');

      // Check for email and password inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();

        // Check for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
        await expect(submitButton).toBeVisible();
      }
    });

    test('Help page should display content', async ({ page }) => {
      await page.goto('/help');

      // Check for help content
      const helpContent = page.locator('main');
      await expect(helpContent).toBeVisible();

      // Check for FAQ or help sections
      const headings = page.locator('h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });
  });

  // Performance tests
  test.describe('Performance', () => {
    test('should load pages quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      // Page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have optimized images', async ({ page }) => {
      await page.goto('/');

      // Check for next/image optimization
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        if (await img.isVisible({ timeout: 1000 }).catch(() => false)) {
          const src = await img.getAttribute('src');
          if (src && !src.startsWith('data:')) {
            // Next.js optimized images should have specific attributes
            const loading = await img.getAttribute('loading');
            expect(['lazy', 'eager']).toContain(loading);
          }
        }
      }
    });
  });
});