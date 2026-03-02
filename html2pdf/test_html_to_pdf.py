import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from playwright.sync_api import sync_playwright

def test_playwright_sync():
    """测试Playwright同步API在单独线程中的工作情况"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # 创建一个简单的HTML文件
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test</title>
        </head>
        <body>
            <h1>Hello, Playwright!</h1>
            <p>This is a test page.</p>
        </body>
        </html>
        """
        html_path = os.path.join(temp_dir, "test.html")
        print(f"html_path: {html_path}")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        # 使用Playwright转换为PDF
        pdf_path = os.path.join(temp_dir, "test.pdf")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                device_scale_factor=2
            )
            page = context.new_page()
            
            local_url = f"file:///{html_path.replace(os.sep, '/')}"
            page.goto(local_url)
            page.wait_for_load_state("networkidle")
            
            page.pdf(
                path=pdf_path,
                width="1920px",
                height="1080px",
                print_background=True,
                scale=1,
                page_ranges=""
            )
            
            browser.close()
        
        # 检查PDF是否生成
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
            print("✅ Playwright sync API test passed! PDF generated successfully.")
            return True
        else:
            print("❌ Playwright sync API test failed! PDF not generated.")
            return False

if __name__ == "__main__":
    print("Testing Playwright sync API in main thread...")
    test_playwright_sync()
    
    print("\nTesting Playwright sync API in separate thread...")
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(test_playwright_sync)
        result = future.result()
    print(f"Thread test result: {'Success' if result else 'Failed'}")