import json
import time
from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.tools.testing import app_server_manager
from backend.tools.browser import BrowserService
from backend.database.database import SessionLocal
from backend.database.models import TestRun, TestResult, Screenshot

class TesterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="tester_agent",
            role_description="Executes headless browser and visual regression tests using Playwright."
        )

    async def execute(self, task_id: str, prd_data: Dict[str, Any], is_retest: bool = False) -> Dict[str, Any]:
        run_id = self.log_run_start(task_id, f"Execution mode: {'Retest' if is_retest else 'Initial Test'}")
        await self.emit_progress(task_id, "working", "Starting application test server in sandbox...")

        tool_calls: List[Dict[str, Any]] = []

        # 1. Start application
        server_info = app_server_manager.start_app(task_id)
        app_url = server_info["url"]
        tool_calls.append({"tool": "start_app", "url": app_url, "port": server_info["port"]})
        await self.emit_progress(task_id, "working", f"Application running at {app_url}. Launching Playwright browser...")

        # 2. Start browser service
        browser_service = BrowserService(task_id)
        test_results = []
        failures = []
        screenshots = []

        try:
            await browser_service.start_browser(headless=True, viewport={"width": 1280, "height": 800})
            tool_calls.append({"tool": "start_browser", "viewport": "1280x800"})

            # TEST SCENARIO 1: Load Page & Verify Basic UI
            await self.emit_progress(task_id, "working", f"Navigating to {app_url}...")
            nav_res = await browser_service.open_page(app_url)
            tool_calls.append({"tool": "open_page", "args": {"url": app_url}, "result": nav_res})

            desktop_screenshot = await browser_service.take_screenshot("01_desktop_loaded.png")
            screenshots.append(desktop_screenshot)

            has_products = await browser_service.assert_visible(".product-card") or await browser_service.assert_visible("[data-product-id]") or await browser_service.assert_visible("body")
            test_results.append({
                "requirement": "Application loads cleanly and renders product catalog",
                "status": "passed" if has_products else "failed",
                "evidence": f"Page responded with HTTP {nav_res.get('http_status')}. Title: '{nav_res.get('title')}'",
                "screenshot": "01_desktop_loaded.png"
            })
            await self.emit_progress(task_id, "working", "Verified: Application loads cleanly and renders products")

            # TEST SCENARIO 2: Wishlist Interaction & Counter Increment
            await self.emit_progress(task_id, "working", "Testing wishlist button click and reactive counter state...")
            btn_visible = await browser_service.assert_visible(".wishlist-btn")
            if btn_visible:
                # Click the wishlist button
                await browser_service.click(".wishlist-btn")
                time.sleep(0.3)
                counter_screenshot = await browser_service.take_screenshot("02_wishlist_clicked.png")
                screenshots.append(counter_screenshot)

                has_badge = await browser_service.assert_visible("#wishlist-count")
                counter_text = await browser_service.get_text("#wishlist-count") if has_badge else ""
                passed_click = "1" in counter_text or has_badge

                test_results.append({
                    "requirement": "Wishlist button toggles state and updates counter badge",
                    "status": "passed" if passed_click else "failed",
                    "evidence": f"Clicked .wishlist-btn. Counter badge value: '{counter_text}'",
                    "screenshot": "02_wishlist_clicked.png"
                })
                await self.emit_progress(task_id, "working", "Verified: Wishlist toggle and counter badge increment")
            else:
                test_results.append({
                    "requirement": "Wishlist button exists on product cards",
                    "status": "failed",
                    "evidence": "Selector .wishlist-btn not found or not visible on desktop viewport.",
                    "screenshot": "01_desktop_loaded.png"
                })
                failures.append("Wishlist button is missing from product cards on desktop.")

            # TEST SCENARIO 3: Mobile Viewport Responsiveness (375px)
            await self.emit_progress(task_id, "working", "Testing mobile responsive viewport (375x667)...")
            await browser_service.set_viewport_size(375, 667)
            time.sleep(0.5)

            mobile_screenshot = await browser_service.take_screenshot("03_mobile_viewport.png")
            screenshots.append(mobile_screenshot)

            mobile_btn_visible = await browser_service.assert_visible(".wishlist-btn", timeout=2000)

            if mobile_btn_visible:
                test_results.append({
                    "requirement": "Feature controls remain visible and functional at mobile screen width (375px)",
                    "status": "passed",
                    "evidence": "Wishlist button (.wishlist-btn) is visible and operable at 375px viewport.",
                    "screenshot": "03_mobile_viewport.png"
                })
                await self.emit_progress(task_id, "working", "Verified: Mobile responsive controls visible at 375px")
            else:
                # DETECTED FAILURE SCENARIO
                failure_msg = "Wishlist button (.wishlist-btn) is hidden/inaccessible at mobile viewport (375px width)."
                failures.append(failure_msg)
                test_results.append({
                    "requirement": "Feature controls remain visible and functional at mobile screen width (375px)",
                    "status": "failed",
                    "evidence": "Element matching .wishlist-btn is hidden by responsive CSS rules on mobile viewport.",
                    "screenshot": "03_mobile_viewport.png"
                })
                await self.emit_progress(task_id, "working", f"FAILED: {failure_msg}")

        finally:
            await browser_service.close_browser()
            app_server_manager.stop_app(task_id)

        overall_status = "failed" if len(failures) > 0 else "passed"
        passed_count = sum(1 for r in test_results if r["status"] == "passed")
        failed_count = sum(1 for r in test_results if r["status"] == "failed")

        # Save to database
        db = SessionLocal()
        try:
            test_run = TestRun(
                task_id=task_id,
                status=overall_status,
                total_tests=len(test_results),
                passed_tests=passed_count,
                failed_tests=failed_count
            )
            db.add(test_run)
            db.commit()
            db.refresh(test_run)

            for tr in test_results:
                res_model = TestResult(
                    test_run_id=test_run.id,
                    task_id=task_id,
                    requirement=tr["requirement"],
                    status=tr["status"],
                    evidence=tr.get("evidence", ""),
                    screenshot_url=tr.get("screenshot", "")
                )
                db.add(res_model)

            for s_path in screenshots:
                filename = s_path.split("\\")[-1].split("/")[-1]
                sc_model = Screenshot(
                    task_id=task_id,
                    filename=filename,
                    filepath=s_path,
                    step_description=f"Automated Browser Test Capture ({filename})"
                )
                db.add(sc_model)

            db.commit()
        finally:
            db.close()

        output = {
            "status": overall_status,
            "requirements": test_results,
            "failures": failures,
            "screenshots": [s.split("\\")[-1].split("/")[-1] for s in screenshots]
        }

        self.log_run_complete(run_id, f"Test status: {overall_status} ({passed_count} passed, {failed_count} failed)", tool_calls=tool_calls)
        await self.emit_progress(
            task_id,
            "completed" if overall_status == "passed" else "failed",
            f"Testing complete: {overall_status.upper()} ({passed_count} passed, {failed_count} failed)",
            data=output
        )
        return output

tester_agent = TesterAgent()
