import sys
from diffusers import DiffusionPipeline
import torch
import re
import os
from TTS.api import TTS
from diffusers import FluxKontextPipeline
from diffusers.utils import load_image

# Load the pipeline with CPU fallback if CUDA not available
try:
    pipe = DiffusionPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        use_safetensors=True,
        variant="fp16"
    )   
    pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")
except Exception as e:
    print(f"Error loading pipeline: {e}", file=sys.stderr)
    sys.exit(1)

def generate_image(prompt: str) -> str:
    try:
        # Generate image
        image = pipe(prompt, num_inference_steps=40, guidance_scale=5.0).images[0]
        
        # Create safe filename
        title = prompt[:20]  # Take first 20 chars instead of 10
        title = re.sub(r'[\\/*?:"<>|]', "", title).strip() or "generated_image"
        
        # Speicherort im public-Ordner
        save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'generated'))
        os.makedirs(save_dir, exist_ok=True)
        filename = f"{title}.png"
        filepath = os.path.join(save_dir, filename)
        
        # Save image
        image.save(filepath)
        
        # Browser-Pfad zurückgeben
        return f"/generated/{filename}"
    except Exception as e:
        print(f"Error generating image: {e}", file=sys.stderr)
        return ""


    
def generateAudio(text: str, speaker: str, language: str) -> str:
    try:
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
        
        
        
        save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'generated'))
        os.makedirs(save_dir, exist_ok=True)
        
        # Sicheren Dateinamen erstellen
        safe_text = re.sub(r'[\\/*?:"<>|]', "", text[:20]).strip() or "audio"
        filename = f"{safe_text}.wav"
        filepath = os.path.join(save_dir, filename)
        
        tts.tts_to_file(
            text=text,
            file_path=filepath,
            speaker=speaker,
            language=language
        )
        
        return f"/generated/{filename}"
    except Exception as e:
        return ""

if __name__ == "__main__":
    if len(sys.argv) < 3:
        
        sys.exit(1)
    
    function_name = sys.argv[1]
    input_text = sys.argv[2]
    try:
        speaker = sys.argv[3]
        language = sys.argv[4]
    except:
        print("No Speaker")
    
    if function_name == "image":
        result = generate_image(input_text)
    elif function_name == "audio":
        result = generateAudio(input_text,speaker,language)
    else:
        sys.exit(1)
    
    if result:
        print(result)
    else:
        sys.exit(1)