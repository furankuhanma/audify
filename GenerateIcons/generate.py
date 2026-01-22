from PIL import Image
import os

# 1. Point to where your master image actually is
source_file = "GenerateIcons/master-icon.png" 

# 2. Point to where the icons should go so the web app sees them
# I suggest moving them to public/icons/
output_dir = "public/icons" 

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

def generate_icons(source_path):
    try:
        with Image.open(source_path) as img:
            for size in sizes:
                resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                resized_img.save(f"{output_dir}/icon-{size}x{size}.png")
                print(f"✅ Created: {output_dir}/icon-{size}x{size}.png")
    except FileNotFoundError:
        print(f"❌ Error: Could not find {source_path}. Check your folder names!")

if __name__ == "__main__":
    generate_icons(source_file)