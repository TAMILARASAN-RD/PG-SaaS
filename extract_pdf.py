import sys
try:
    from pypdf import PdfReader
    
    reader = PdfReader("gpt pg saas.pdf")
    
    # PDF pages are 0-indexed. 
    # To get physical pages 154 to 164, we extract indices 153 to 164 (up to 163).
    # Since the user wants "page 154-164", it might mean 11 pages (154, 155, ... 164).
    # We will extract index 153 to 163. I'll just extract 150 to 166 just to be safe if there's offset.
    
    start_page = 153
    end_page = 163 # inclusive 163 means index 164 exclusive
    
    print(f"Extracting pages {start_page+1} to {end_page+1}...")
    text = ""
    for i in range(start_page, end_page + 1):
        if i < len(reader.pages):
            text += f"\n--- PAGE {i+1} ---\n"
            text += reader.pages[i].extract_text()
            
    with open("pdf_extracted.txt", "w", encoding="utf-8") as f:
        f.write(text)
        
    print("Extraction successful. Saved to pdf_extracted.txt.")
except Exception as e:
    print(f"Error: {e}")
