"""Turn a trained LoRA adapter into an Ollama model.

Two stages, independently runnable:

1. Merge + convert (--adapter-path -> GGUF): loads the base model at full
   precision, merges the LoRA adapter from Colab into it, and converts the
   result to GGUF via a local llama.cpp checkout. Needs torch/transformers/
   peft (see requirements-deploy.txt, deliberately kept out of the main
   service's requirements.txt — this script runs standalone, not as part of
   the FastAPI process) and a built llama.cpp. THIS STAGE HAS NOT BEEN RUN —
   there is no GPU here to produce a real adapter to test it against. Treat
   it as reference code to verify once a real Colab adapter exists.

2. Modelfile + `ollama create` (GGUF or an existing Ollama model -> a new
   Ollama model): this stage has been run for real, against the existing
   local qwen2.5:3b-instruct model, as a plumbing smoke test — see the
   AI Service README's deploy section for the exact command and its output.

Usage (full pipeline, once a real adapter exists):
    python scripts/deploy_to_ollama.py \\
        --adapter-path /path/to/candidate_analysis_lora \\
        --model-name candidate-analysis-lora-v1 \\
        --llama-cpp-dir /path/to/llama.cpp

Usage (plumbing-only smoke test, no adapter needed):
    python scripts/deploy_to_ollama.py \\
        --from-model qwen2.5:3b-instruct \\
        --model-name deploy-smoke-test \\
        --skip-merge
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.domain.candidate_analysis.prompts import CANDIDATE_ANALYSIS_SYSTEM  # noqa: E402

_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "ollama" / "Modelfile.template"


def merge_and_convert(adapter_path: str, base_model: str, llama_cpp_dir: str, quantization: str) -> str:
    """Merge the LoRA adapter into the base model and convert to a quantized
    GGUF file. Returns the GGUF path. Requires torch/transformers/peft and a
    built llama.cpp checkout — see requirements-deploy.txt.
    """
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    merged_dir = Path(tempfile.mkdtemp(prefix="merged-"))
    print(f"Loading base model {base_model} at full precision for a clean merge...")
    base = AutoModelForCausalLM.from_pretrained(
        base_model, torch_dtype=torch.bfloat16, device_map="cpu"
    )
    tokenizer = AutoTokenizer.from_pretrained(base_model)

    print(f"Merging LoRA adapter from {adapter_path}...")
    merged = PeftModel.from_pretrained(base, adapter_path)
    merged = merged.merge_and_unload()
    merged.save_pretrained(merged_dir)
    tokenizer.save_pretrained(merged_dir)

    convert_script = Path(llama_cpp_dir) / "convert_hf_to_gguf.py"
    if not convert_script.exists():
        raise FileNotFoundError(
            f"{convert_script} not found. Clone https://github.com/ggerganov/llama.cpp "
            "and build it (needed for the GGUF conversion + quantize binary), then pass "
            "--llama-cpp-dir pointing at that checkout."
        )

    raw_gguf = merged_dir / "model-f16.gguf"
    print("Converting merged model to GGUF (f16)...")
    subprocess.run(
        [sys.executable, str(convert_script), str(merged_dir), "--outfile", str(raw_gguf), "--outtype", "f16"],
        check=True,
    )

    quantize_bin = Path(llama_cpp_dir) / "llama-quantize"
    if not quantize_bin.exists():
        raise FileNotFoundError(
            f"{quantize_bin} not found — build llama.cpp first (`make` or `cmake --build .` "
            "in the llama.cpp checkout produces this binary)."
        )

    quantized_gguf = merged_dir / f"model-{quantization}.gguf"
    print(f"Quantizing to {quantization}...")
    subprocess.run(
        [str(quantize_bin), str(raw_gguf), str(quantized_gguf), quantization],
        check=True,
    )
    return str(quantized_gguf)


def render_modelfile(from_source: str) -> str:
    template = _TEMPLATE_PATH.read_text()
    return (
        template.replace("{{GGUF_PATH}}", from_source)
        .replace("{{SYSTEM_PROMPT}}", CANDIDATE_ANALYSIS_SYSTEM)
    )


def create_ollama_model(model_name: str, from_source: str) -> None:
    modelfile_content = render_modelfile(from_source)
    with tempfile.NamedTemporaryFile("w", suffix=".Modelfile", delete=False) as f:
        f.write(modelfile_content)
        modelfile_path = f.name

    print(f"Running: ollama create {model_name} -f {modelfile_path}")
    subprocess.run(["ollama", "create", model_name, "-f", modelfile_path], check=True)
    print(f"Done. Deployed as Ollama model '{model_name}'.")
    print(
        "Note: OllamaProvider still reads a fixed AI_MODEL from .env — "
        "point it at this tag manually to actually serve it (see README's "
        "known-gap note on dynamic model selection)."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model-name", required=True, help="Ollama model tag to create")
    parser.add_argument("--skip-merge", action="store_true", help="Skip merge/convert/quantize; use --from-model directly")
    parser.add_argument("--from-model", help="Existing Ollama model or GGUF path to use as FROM (implies --skip-merge)")
    parser.add_argument("--adapter-path", help="Path to the LoRA adapter directory downloaded from Colab")
    parser.add_argument("--base-model", default="Qwen/Qwen2.5-3B-Instruct")
    parser.add_argument("--llama-cpp-dir", help="Path to a built llama.cpp checkout")
    parser.add_argument("--quantization", default="q4_K_M")
    args = parser.parse_args()

    if args.skip_merge or args.from_model:
        if not args.from_model:
            parser.error("--skip-merge requires --from-model")
        from_source = args.from_model
    else:
        if not args.adapter_path or not args.llama_cpp_dir:
            parser.error("full pipeline requires --adapter-path and --llama-cpp-dir")
        from_source = merge_and_convert(
            args.adapter_path, args.base_model, args.llama_cpp_dir, args.quantization
        )

    create_ollama_model(args.model_name, from_source)


if __name__ == "__main__":
    main()
