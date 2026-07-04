import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def generate_ai_recommendation(subject_data: str, signals: dict) -> dict:
    payload = json.dumps({
        "subject": subject_data,
        "network_signals": signals,
    })

    prompt = f"""You are an expert financial crime investigator protecting the HSBC Green Financing Framework.

Review the following automated counterparty risk network payload for the entity '{subject_data}'.

Payload: {payload}

Synthesize these mathematical network signals into a single recommendation.

Classify the alert as requiring a 'SAR_FILING_REQUIRED' or 'ENHANCED_DUE_DILIGENCE'.

Provide a plain-language rationale supporting your decision.

Explicitly explain:
- How the address density indicates shell companies utilized by a Gatekeeper
- How any detected cycles indicate siphoning back to a UBO (Ultimate Beneficial Owner)
- How the shortest path indicates a violation of the 100gCO2/kWh exclusion rule

Respond ONLY in the following JSON format, with no preamble, no markdown formatting, no code fences:
{{
  "classification": "SAR_FILING_REQUIRED" or "ENHANCED_DUE_DILIGENCE" or "NO_ACTION_REQUIRED",
  "rationale": "plain language explanation",
  "risk_indicators": {{
    "gatekeeper_evidence": "explanation or null",
    "ubo_siphoning_evidence": "explanation or null",
    "exclusion_violation_evidence": "explanation or null"
  }}
}}"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        parsed = {
            "classification": "PARSE_ERROR",
            "rationale": raw_text,
            "risk_indicators": {},
        }

    return parsed


if __name__ == "__main__":
    test_signals = {
        "circular_flow_detected": [["Gaurav_Sustainable_Corp", "Bharat_Logistics_MSME", "Partha_UBO"]],
        "exposure_to_exclusion": [["Gaurav_Sustainable_Corp", "Anup_Consulting_MSME", "Entity_High_Carbon"]],
        "shared_address_density": 2,
    }
    result = generate_ai_recommendation("Gaurav_Sustainable_Corp", test_signals)
    print(json.dumps(result, indent=2))