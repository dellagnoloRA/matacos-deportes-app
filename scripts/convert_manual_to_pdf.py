import os
import subprocess
import markdown

def convert_md_to_pdf():
    input_md = os.path.abspath('docs/MANUAL_DE_USUARIO.md')
    output_pdf = os.path.abspath('docs/MANUAL_DE_USUARIO.pdf')
    temp_html = os.path.abspath('docs/temp_manual.html')

    with open(input_md, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace math arrow syntax if any for clean copy-paste
    content = content.replace(r'$\rightarrow$', '→')

    # Convert markdown to html with standard extensions
    body_html = markdown.markdown(
        content,
        extensions=['tables', 'fenced_code', 'sane_lists']
    )

    # Clean, simple styling - strictly no unnecessary formatting, decorations or colors
    # Optimized for reading, copying and pasting plain text smoothly
    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Manual de Usuario - Matacos Deportes</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 20mm 15mm;
  }}
  body {{
    font-family: Arial, "Segoe UI", sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #111;
    margin: 0;
    padding: 0;
  }}
  h1 {{
    font-size: 18pt;
    font-weight: bold;
    margin-top: 0;
    margin-bottom: 8pt;
    page-break-after: avoid;
  }}
  h2 {{
    font-size: 14pt;
    font-weight: bold;
    margin-top: 18pt;
    margin-bottom: 6pt;
    border-bottom: 1px solid #ccc;
    padding-bottom: 3pt;
    page-break-after: avoid;
  }}
  h3 {{
    font-size: 12pt;
    font-weight: bold;
    margin-top: 14pt;
    margin-bottom: 4pt;
    page-break-after: avoid;
  }}
  h4 {{
    font-size: 11pt;
    font-weight: bold;
    margin-top: 10pt;
    margin-bottom: 3pt;
    page-break-after: avoid;
  }}
  p {{
    margin-top: 0;
    margin-bottom: 8pt;
  }}
  ul, ol {{
    margin-top: 0;
    margin-bottom: 8pt;
    padding-left: 20pt;
  }}
  li {{
    margin-bottom: 3pt;
  }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin-top: 8pt;
    margin-bottom: 14pt;
    font-size: 9pt;
  }}
  th, td {{
    border: 1px solid #aaa;
    padding: 5pt 6pt;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #f2f2f2;
    font-weight: bold;
  }}
  tr {{
    page-break-inside: avoid;
  }}
  pre {{
    font-family: Consolas, "Courier New", monospace;
    font-size: 8pt;
    line-height: 1.25;
    background-color: #f9f9f9;
    border: 1px solid #ccc;
    padding: 6pt 8pt;
    margin: 8pt 0;
    white-space: pre;
    overflow-x: auto;
    page-break-inside: avoid;
  }}
  code {{
    font-family: Consolas, "Courier New", monospace;
    font-size: 9pt;
    background-color: #f0f0f0;
    padding: 1pt 3pt;
    border-radius: 2pt;
  }}
  pre code {{
    background-color: transparent;
    padding: 0;
    font-size: inherit;
  }}
  blockquote {{
    margin: 8pt 0;
    padding: 6pt 10pt;
    border-left: 3px solid #888;
    background-color: #fafafa;
    page-break-inside: avoid;
  }}
  blockquote p:last-child {{
    margin-bottom: 0;
  }}
  hr {{
    border: none;
    border-top: 1px solid #ccc;
    margin: 14pt 0;
  }}
  a {{
    color: #0044cc;
    text-decoration: none;
  }}
</style>
</head>
<body>
{body_html}
</body>
</html>"""

    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    edge_candidates = [
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    ]
    edge_path = next((p for p in edge_candidates if os.path.exists(p)), None)
    if not edge_path:
        raise FileNotFoundError("Microsoft Edge executable not found.")

    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        f'--print-to-pdf={output_pdf}',
        temp_html
    ]

    print(f"Converting '{input_md}' to '{output_pdf}' via Edge headless...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if os.path.exists(temp_html):
        os.remove(temp_html)

    if os.path.exists(output_pdf) and os.path.getsize(output_pdf) > 0:
        print(f"Success! PDF generated at: {output_pdf} ({os.path.getsize(output_pdf)} bytes)")
    else:
        print(f"Failed to generate PDF. Returncode: {result.returncode}, Stderr: {result.stderr}")

if __name__ == '__main__':
    convert_md_to_pdf()
