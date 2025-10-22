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
        # -> Fill in the pet and owner information and click 'Próximo →' to proceed to the service selection step.
        frame = context.pages[-1]
        # Input pet name
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Buddy')
        

        frame = context.pages[-1]
        # Input pet breed
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Golden Retriever')
        

        frame = context.pages[-1]
        # Input owner name
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('John Doe')
        

        frame = context.pages[-1]
        # Input owner address
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[4]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123 Pet Street')
        

        frame = context.pages[-1]
        # Input WhatsApp number
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[5]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('(12) 34567-8901')
        

        frame = context.pages[-1]
        # Click 'Próximo →' to proceed to service selection
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select any service type and click 'Próximo →' to proceed to the time selection step.
        frame = context.pages[-1]
        # Select 'Banho & Tosa' service category
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Próximo →' to proceed to the time selection step.
        frame = context.pages[-1]
        # Click 'Próximo →' to proceed to time selection step
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a service option (e.g., 'Banho & Tosa') to enable the 'Próximo →' button, then click it to proceed to the time selection step.
        frame = context.pages[-1]
        # Select 'Banho & Tosa' service option to enable 'Próximo →' button
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a pet weight from the dropdown and click 'Próximo →' to proceed to the time selection step.
        frame = context.pages[-1]
        # Open pet weight dropdown
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[2]/select').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Próximo →' button to proceed to the time selection step where appointment time can be selected.
        frame = context.pages[-1]
        # Click 'Próximo →' to proceed to time selection step
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Attempt to select a time slot within the lunch break (12:00 to 13:00). Since 12:00 is not available, try selecting 13:00 and then attempt to submit the appointment to check for any error preventing scheduling during lunch break.
        frame = context.pages[-1]
        # Click on 13:00 time slot to attempt scheduling during lunch break
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[2]/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Próximo →' to submit the appointment request
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the '✓ Confirmar Agendamento' button to finalize and confirm the appointment.
        frame = context.pages[-1]
        # Click '✓ Confirmar Agendamento' button to finalize the appointment
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Agendamento Online').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Próximo →').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Acesso Administrativo').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Informações do Pet e Dono').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nome do Pet').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Raça do Pet').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Seu Nome').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Seu Endereço').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=WhatsApp').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    