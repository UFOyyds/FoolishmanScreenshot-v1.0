from PIL import Image
import os

def resize_icon(input_path, output_path, size):
    with Image.open(input_path) as img:
        img.resize((size, size), Image.LANCZOS).save(output_path)

def main():
    base_dir = r"E:\GenAI_App_Development\video_record_v2.1"
    input_file = os.path.join(base_dir, "icon.png")
    
    sizes = [16, 48, 128]
    
    for size in sizes:
        output_file = os.path.join(base_dir, f"icon{size}.png")
        resize_icon(input_file, output_file, size)
        print(f"Created {output_file}")

if __name__ == "__main__":
    main()