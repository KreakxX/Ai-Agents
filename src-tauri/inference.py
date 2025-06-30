import sys
from diffusers import DiffusionPipeline
import torch
import re
import os
from TTS.api import TTS
from transformers import pipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline


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


model_cache = {}
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

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
    
def loadModelsFromCache(model_name: str):
    if model_name not in model_cache:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            trust_remote_code=True,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        ).to(device)
        model_cache[model_name] = (model, tokenizer)
    return model_cache[model_name]

       

def generateText(prompt: str, model_name: str) -> str:
    try:
        model,tokenizer = loadModelsFromCache(model_name)
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        output = model.generate(**inputs, max_new_tokens=128)
        return tokenizer.decode(output[0], skip_special_tokens=True)
    except Exception as e:
        print("e")


    
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

    if function_name == "image":
        result = generate_image(input_text)
    elif function_name == "audio":
        if len(sys.argv) < 5:
            print("Missing speaker or language", file=sys.stderr)
            sys.exit(1)
        speaker = sys.argv[3]
        language = sys.argv[4]
        result = generateAudio(input_text, speaker, language)
    elif function_name == "text":
        if len(sys.argv) < 4:
            print("Missing model_name", file=sys.stderr)
            sys.exit(1)
        model_name = sys.argv[3]
        result = generateText(input_text, model_name)
    else:
        sys.exit(1)
    
    if result:
        print(result)
    else:
        sys.exit(1)