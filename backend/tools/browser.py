import os
from pathlib import Path
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, Page, Playwright
from backend.workspace.manager import workspace_manager

class BrowserService:
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.screenshots_dir = workspace_manager.get_task_dir(task_id) / "screenshots"
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)

    async def start_browser(self, headless: bool = True, viewport: Optional[dict] = None) -> Dict[str, Any]:
        """Launches Chromium browser session."""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            vp = viewport or {"width": 1280, "height": 800}
            self.page = await self.browser.new_page(viewport=vp)
        return {"status": "browser_started", "viewport": viewport}

    async def set_viewport_size(self, width: int, height: int):
        if self.page:
            await self.page.set_viewport_size({"width": width, "height": height})

    async def open_page(self, url: str) -> Dict[str, Any]:
        """Navigates to specified URL."""
        if not self.page:
            await self.start_browser()
        response = await self.page.goto(url, wait_until="networkidle", timeout=15000)
        status = response.status if response else 200
        title = await self.page.title()
        return {"status": "navigated", "url": url, "http_status": status, "title": title}

    async def click(self, selector: str) -> Dict[str, Any]:
        """Clicks on element matching selector."""
        await self.page.wait_for_selector(selector, timeout=5000)
        await self.page.click(selector)
        return {"status": "clicked", "selector": selector}

    async def fill(self, selector: str, text: str) -> Dict[str, Any]:
        """Types text into input matching selector."""
        await self.page.wait_for_selector(selector, timeout=5000)
        await self.page.fill(selector, text)
        return {"status": "filled", "selector": selector, "text": text}

    async def get_text(self, selector: str) -> str:
        """Retrieves inner text of selector."""
        await self.page.wait_for_selector(selector, timeout=5000)
        return await self.page.inner_text(selector)

    async def assert_visible(self, selector: str, timeout: int = 5000) -> bool:
        """Verifies selector is visible on page."""
        try:
            await self.page.wait_for_selector(selector, state="visible", timeout=timeout)
            return True
        except Exception:
            return False

    async def assert_text(self, selector: str, expected: str, timeout: int = 5000) -> bool:
        """Verifies selector contains expected text."""
        try:
            await self.page.wait_for_selector(selector, timeout=timeout)
            text = await self.page.inner_text(selector)
            return expected.lower() in text.lower()
        except Exception:
            return False

    async def take_screenshot(self, filename: str) -> str:
        """Captures full-page screenshot and saves to task screenshots dir."""
        if not filename.endswith(".png"):
            filename = f"{filename}.png"
        filepath = self.screenshots_dir / filename
        await self.page.screenshot(path=str(filepath), full_page=True)
        return str(filepath)

    async def close_browser(self):
        """Closes browser and stops Playwright."""
        if self.page:
            try:
                await self.page.close()
            except Exception:
                pass
            self.page = None
        if self.browser:
            try:
                await self.browser.close()
            except Exception:
                pass
            self.browser = None
        if self.playwright:
            try:
                await self.playwright.stop()
            except Exception:
                pass
            self.playwright = None
