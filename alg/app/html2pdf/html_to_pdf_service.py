import os
import zipfile
import re
from typing import Tuple, List

from playwright.sync_api import sync_playwright
from PyPDF2 import PdfMerger

from app.diagnosis.common.service_registry import register_service


@register_service()
class HtmlToPdfService:
    def __init__(self):
        """
        初始化HtmlToPdfService，创建必要的目录结构
        """
        # 创建当前目录下的必要目录
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.upload_dir = os.path.join(self.base_dir, "upload")
        self.temp_dir = os.path.join(self.base_dir, "temp")
        self.output_dir = os.path.join(self.base_dir, "output")
        
        # 确保目录存在
        for dir_path in [self.upload_dir, self.temp_dir, self.output_dir]:
            if not os.path.exists(dir_path):
                os.makedirs(dir_path)
    
    async def convert_html_zip_to_pdf(self, zip_content: bytes) -> Tuple[bytes, str]:
        """
        将HTML压缩包转换为PDF文件
        :param zip_content: HTML压缩包的字节内容
        :return: (PDF字节内容, 文件名)
        """
        # 使用ThreadPoolExecutor在单独的线程中运行同步代码
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=1) as executor:
            # 提交任务到线程池
            future = executor.submit(self._sync_convert_html_zip_to_pdf, zip_content)
            # 等待任务完成并获取结果
            pdf_content, filename = future.result()
        return pdf_content, filename
    
    def _sync_convert_html_zip_to_pdf(self, zip_content: bytes) -> Tuple[bytes, str]:
        """
        同步版本的HTML压缩包转PDF方法
        :param zip_content: HTML压缩包的字节内容
        :return: (PDF字节内容, 文件名)
        """
        # 在Windows环境中，显式设置asyncio事件循环为ProactorEventLoop以支持子进程
        import sys
        if sys.platform == 'win32':
            import asyncio
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
        # PPT 尺寸 (1920x1080)
        PPT_WIDTH = 1920
        PPT_HEIGHT = 1080
        
        # 保存上传的zip文件
        zip_path = os.path.join(self.upload_dir, "input.zip")
        with open(zip_path, "wb") as f:
            f.write(zip_content)
        
        # 保存提取目录路径，以便在整个过程完成后清理
        extract_dir = os.path.join(self.temp_dir, "extract")
        
        try:
            # 提取HTML文件列表
            html_files = self._extract_html_files_from_zip(zip_path)
            
            if not html_files:
                raise Exception("No HTML files found in zip file")
            
            # 转换HTML为PDF
            pdf_files = self._convert_html_to_pdf(html_files, PPT_WIDTH, PPT_HEIGHT)
            
            if not pdf_files:
                raise Exception("No PDF files generated")
            
            # 合并PDF文件
            output_pdf_path = os.path.join(self.output_dir, "output.pdf")
            self._merge_pdf_files(pdf_files, output_pdf_path)
            
            # 读取PDF内容
            with open(output_pdf_path, "rb") as f:
                pdf_content = f.read()
            
            return pdf_content, "output.pdf"
        finally:
            # 清理临时文件
            if os.path.exists(zip_path):
                os.remove(zip_path)
            
            # 在整个转换过程完成后再清理提取目录
            import shutil
            if os.path.exists(extract_dir):
                try:
                    shutil.rmtree(extract_dir)
                    print(f"清理临时目录: {extract_dir}")
                except Exception as e:
                    print(f"清理临时目录失败: {e}")
                    # 继续执行，不因为清理失败而中断整个流程
    
    def _extract_html_files_from_zip(self, zip_path: str) -> List[str]:
        """
        从zip文件中提取HTML文件列表
        :param zip_path: zip文件路径
        :return: HTML文件路径列表
        """
        # 解压压缩包到temp目录
        extract_dir = os.path.join(self.temp_dir, "extract")
        if not os.path.exists(extract_dir):
            os.makedirs(extract_dir)
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # 显示zip文件中的所有文件
                print(f"zip文件中的文件列表: {zip_ref.namelist()}")
                # 解压所有文件，确保编码正确
                for member in zip_ref.namelist():
                    # 处理文件名编码，尝试不同的编码方案
                    try:
                        # 尝试UTF-8编码
                        filename = member.encode('cp437').decode('utf-8')
                    except UnicodeDecodeError:
                        try:
                            # 尝试GBK编码
                            filename = member.encode('cp437').decode('gbk')
                        except UnicodeDecodeError:
                            # 如果都失败，使用原始编码
                            filename = member
                    
                    # 构建目标路径
                    target_path = os.path.join(extract_dir, filename)
                    
                    # 检查是否是目录
                    if member.endswith('/') or member.endswith('\\'):
                        # 如果是目录，确保目录存在
                        os.makedirs(target_path, exist_ok=True)
                        print(f"创建目录: {target_path}")
                    else:
                        # 如果是文件，确保目录存在并提取文件
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        # 提取文件
                        with zip_ref.open(member) as source, open(target_path, 'wb') as target:
                            target.write(source.read())
                        print(f"提取文件: {member} -> {target_path}")
            
            # 显示解压后的文件结构
            print("\n解压后的文件结构:")
            for root, dirs, files in os.walk(extract_dir):
                level = root.replace(extract_dir, '').count(os.sep)
                indent = ' ' * 2 * level
                print(f"{indent}{os.path.basename(root)}/")
                subindent = ' ' * 2 * (level + 1)
                for file in files:
                    print(f"{subindent}{file}")
            
            # 递归查找index.html
            index_path = None
            for root, dirs, files in os.walk(extract_dir):
                if "index.html" in files:
                    index_path = os.path.join(root, "index.html")
                    print(f"找到index.html: {index_path}")
                    break
            
            if not index_path:
                raise FileNotFoundError("index.html not found in zip file")
            
            # 从index.html中提取文件顺序
            base_dir = os.path.dirname(index_path)
            ordered_files = self.get_ordered_files_from_index(index_path)
            
            # 构建完整的HTML文件路径
            html_files = []
            if ordered_files:
                # 使用从index.html中提取的顺序
                print(f"从index.html中提取的文件顺序: {ordered_files}")
                print(f"基础目录: {base_dir}")
                for filename in ordered_files:
                    # 清理文件名中的可能的路径分隔符问题
                    filename = filename.replace('/', os.sep).replace('\\', os.sep)
                    html_path = os.path.join(base_dir, filename)
                    print(f"检查文件: {html_path}")
                    print(f"文件是否存在: {os.path.exists(html_path)}")
                    if os.path.exists(html_path):
                        html_files.append(html_path)
                        print(f"✓ 添加文件到处理列表: {html_path}")
                    else:
                        print(f"⚠️ 跳过缺失文件: {filename}")
                        # 尝试查找相似的文件
                        import glob
                        similar_files = glob.glob(os.path.join(base_dir, "*.html"))
                        if similar_files:
                            print(f"  在目录中找到的HTML文件: {similar_files}")
            else:
                # 如果没有提取到文件顺序，使用文件名排序
                for root, dirs, files in os.walk(base_dir):
                    for file in files:
                        if file.endswith('.html') and file != 'index.html':
                            html_path = os.path.join(root, file)
                            html_files.append(html_path)
                html_files.sort()
            
            return html_files
        finally:
            # 不再在此处清理临时目录，而是在整个转换过程完成后统一清理
            # 这样可以确保在转换过程中源文件不会被删除
            pass
    
    def _convert_html_to_pdf(self, html_files: List[str], width: int, height: int) -> List[str]:
        """
        将HTML文件转换为PDF文件
        :param html_files: HTML文件路径列表
        :param width: 宽度
        :param height: 高度
        :return: PDF文件路径列表
        """
        pdf_files = []
        
        # 创建PDF临时目录
        pdf_temp_dir = os.path.join(self.temp_dir, "pdf")
        if not os.path.exists(pdf_temp_dir):
            os.makedirs(pdf_temp_dir)
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                # 开启高分屏模拟 (Scale=2)，保证文字清晰
                context = browser.new_context(
                    viewport={'width': width, 'height': height},
                    device_scale_factor=2
                )
                page = context.new_page()
                
                for i, html_file in enumerate(html_files):
                    pdf_path = os.path.join(pdf_temp_dir, f"{i:03d}_{os.path.basename(html_file)}.pdf")
                    # 构建本地URL，使用更简单的方式
                    # 直接将路径转换为正斜杠，不进行URL编码
                    local_url = f"file:///{html_file.replace(os.sep, '/')}"
                    
                    print(f"处理文件: {html_file}")
                    print(f"构建的URL: {local_url}")
                    print(f"文件是否存在: {os.path.exists(html_file)}")
                    print(f"文件大小: {os.path.getsize(html_file) if os.path.exists(html_file) else 'N/A'}")
                    
                    try:
                        page.goto(local_url)
                        page.wait_for_load_state("networkidle")
                        
                        # 注入 CSS 优化 (字体平滑 + 强制尺寸)
                        page.add_style_tag(content="""
                            body {
                                margin: 0; padding: 0;
                                -webkit-font-smoothing: antialiased;
                                -moz-osx-font-smoothing: grayscale;
                                text-rendering: optimizeLegibility;
                                overflow: hidden;
                            }
                        """)
                        
                        page.pdf(
                            path=pdf_path,
                            width=f"{width}px",
                            height=f"{height}px",
                            print_background=True,
                            scale=1,
                            page_ranges=""
                        )
                        
                        pdf_files.append(pdf_path)
                        
                    except Exception as e:
                        print(f"--> 转换失败: {html_file}, 错误: {e}")
                
                browser.close()
        finally:
            # 注意：这里不清理pdf_temp_dir，因为合并PDF时还需要用到
            # 清理会在更外层的finally中进行
            pass
        
        return pdf_files
    
    def _merge_pdf_files(self, pdf_files: List[str], output_path: str):
        """
        合并PDF文件
        :param pdf_files: PDF文件路径列表
        :param output_path: 输出PDF文件路径
        """
        merger = PdfMerger()
        try:
            for pdf_file in pdf_files:
                merger.append(pdf_file)
            
            # 保存合并后的PDF
            merger.write(output_path)
        finally:
            merger.close()
            
            # 清理临时PDF文件
            for pdf_file in pdf_files:
                if os.path.exists(pdf_file):
                    os.remove(pdf_file)
            
            # 清理PDF临时目录
            pdf_temp_dir = os.path.join(self.temp_dir, "pdf")
            if os.path.exists(pdf_temp_dir):
                import shutil
                shutil.rmtree(pdf_temp_dir)
    
    def get_ordered_files_from_index(self, index_path):
        """
        从 index.html 中提取 'pages' 数组里的文件名顺序
        """
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 使用正则查找所有 file: "xxx.html" 或 file: 'xxx.html'
            pattern = r'file:\s*["\']([^"\']+)["\']'
            files = re.findall(pattern, content)
            
            return files
        except Exception as e:
            print(f"读取 index.html 失败: {e}")
            return []
