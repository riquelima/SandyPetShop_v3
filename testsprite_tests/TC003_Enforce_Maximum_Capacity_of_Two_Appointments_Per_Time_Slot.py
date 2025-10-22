import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5001", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Fill pet and owner information for the first appointment and proceed to next step.
        frame = context.pages[-1]
        # Input pet name for first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Buddy')
        

        frame = context.pages[-1]
        # Input pet breed for first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Golden Retriever')
        

        frame = context.pages[-1]
        # Input owner name for first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Alice Smith')
        

        frame = context.pages[-1]
        # Input owner address for first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[4]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123 Pet Street')
        

        frame = context.pages[-1]
        # Input WhatsApp number for first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[5]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('(12) 34567-8901')
        

        frame = context.pages[-1]
        # Click Próximo to go to services selection
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Banho & Tosa' service category for the first appointment and proceed.
        frame = context.pages[-1]
        # Select 'Banho & Tosa' service category
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Próximo →' to proceed to the time selection step for the first appointment.
        frame = context.pages[-1]
        # Click 'Próximo →' to proceed to time selection for first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a service (e.g., 'Banho & Tosa') and click 'Próximo →' to proceed to the time selection step for the first appointment.
        frame = context.pages[-1]
        # Select 'Banho & Tosa' service category
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Próximo →' to proceed to the time selection step for the first appointment.
        frame = context.pages[-1]
        # Click 'Próximo →' to proceed to time selection step
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a date and time slot for the first appointment and proceed to the next step.
        frame = context.pages[-1]
        # Select date 25th October 2025
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/div[3]/button[23]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Select time slot 10:00
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[2]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Próximo →' to proceed after selecting date and time
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Confirmar Agendamento' to confirm the first appointment and start scheduling the second appointment.
        frame = context.pages[-1]
        # Click 'Confirmar Agendamento' to confirm the first appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Booking Successful! Appointment Confirmed').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test failed: The system did not block the third booking for the same time slot as required by the test plan. Capacity limit error message was not displayed, indicating the booking limit enforcement is not working.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    