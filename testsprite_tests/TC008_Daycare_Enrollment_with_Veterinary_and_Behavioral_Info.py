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
        # -> Attempt to submit enrollment form without filling veterinary or behavior info by clicking 'Próximo →' button.
        frame = context.pages[-1]
        # Click 'Próximo →' button to attempt to proceed without filling veterinary or behavior info.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill all required fields including veterinary and behavior info, then attempt submission again to verify validation and successful enrollment.
        frame = context.pages[-1]
        # Fill 'Nome do Pet' field
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Buddy')
        

        frame = context.pages[-1]
        # Fill 'Raça do Pet' field
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Golden Retriever')
        

        frame = context.pages[-1]
        # Fill 'Seu Nome' field
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('John Doe')
        

        frame = context.pages[-1]
        # Fill 'Seu Endereço' field
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[4]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123 Pet Street')
        

        frame = context.pages[-1]
        # Fill 'WhatsApp' field
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div[5]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('(12) 34567-8901')
        

        frame = context.pages[-1]
        # Click 'Próximo →' button to proceed to next step after filling basic info.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Creche Pet' service and click 'Próximo →' to proceed to next step and verify if veterinary and behavior info are required before submission.
        frame = context.pages[-1]
        # Select 'Creche Pet' service category.
        elem = frame.locator('xpath=html/body/div/div/main/form/div/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Attempt to submit the enrollment form without filling veterinary and behavior info by clicking 'Realizar solicitação de matrícula' button to check for validation prompts.
        frame = context.pages[-1]
        # Click 'Realizar solicitação de matrícula' button to attempt submission without veterinary and behavior info.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill 'Telefone do veterinário(a)' field (index 9) and select options for behavior and health questions, then fill date fields for vaccination, vermifuge, and flea treatment, and finally submit the form.
        frame = context.pages[-1]
        # Fill 'Telefone do veterinário(a)' field
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/div/div[12]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('(12) 34567-8901')
        

        frame = context.pages[-1]
        # Select 'Sim' for 'Se dá bem com outros animais'
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Select 'Sim' for 'Alergia?'
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/div[2]/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Realizar solicitação de matrícula' button to submit the form and confirm successful enrollment.
        frame = context.pages[-1]
        # Click 'Realizar solicitação de matrícula' button to submit the form after filling all required fields.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill the 'Telefone contato' field with a valid phone number and submit the form again to confirm successful enrollment.
        frame = context.pages[-1]
        # Fill 'Telefone contato' field with valid phone number
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/div/div[10]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('(12) 34567-8903')
        

        frame = context.pages[-1]
        # Click 'Realizar solicitação de matrícula' button to submit the form after filling all required fields.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Realizar solicitação de matrícula' button to submit the form and confirm successful enrollment.
        frame = context.pages[-1]
        # Click 'Realizar solicitação de matrícula' button to submit the form after filling all required fields.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill the required field at index 10 with valid data and submit the form again to confirm successful enrollment.
        frame = context.pages[-1]
        # Fill 'Telefone e nome (emergencial)' field with valid phone number
        elem = frame.locator('xpath=html/body/div/div/main/form/div[2]/div/div[11]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('(12) 34567-8904')
        

        frame = context.pages[-1]
        # Click 'Realizar solicitação de matrícula' button to submit the form after filling all required fields.
        elem = frame.locator('xpath=html/body/div/div/main/form/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Task complete.
        frame = context.pages[-1]
        # Click 'OK' button to close the confirmation dialog and finish.
        elem = frame.locator('xpath=html/body/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Próximo →').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Informações do Pet e Dono').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nome do Pet').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Raça do Pet').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Seu Nome').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Seu Endereço').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=WhatsApp').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Acesso Administrativo').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    