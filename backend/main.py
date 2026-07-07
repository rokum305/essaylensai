# -*- coding: utf-8 -*-
"""
EssayLens Backend
FastAPI + spaCy/textstat NLP features + Gemini reasoning
Stats now persisted via Upstash Redis (REST API) instead of a local JSON file,
since Render's free tier wipes local disk on every restart/redeploy.
"""

import os
import re
import json
import time
import httpx
from typing import List

import spacy
import textstat
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# ─────────────────────────────────────────────────────────────────────────────
# Persistent stats via Upstash Redis REST API
# ─────────────────────────────────────────────────────────────────────────────
# Set these two as environment variables on Render (from your Upstash dashboard):
#   UPSTASH_REDIS_REST_URL
#   UPSTASH_REDIS_REST_TOKEN

UPSTASH_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
BASE_COUNT = 100
STATS_KEY = "essaylens:stats"

def _upstash_headers():
    return {"Authorization": f"Bearer {UPSTASH_TOKEN}"}

def get_stats() -> dict:
    default = {"count": BASE_COUNT, "total_words": 0, "total_time": 0.0}
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        # Fallback so local dev without Upstash configured doesn't crash
        return default
    try:
        r = httpx.get(f"{UPSTASH_URL}/get/{STATS_KEY}", headers=_upstash_headers(), timeout=5)
        r.raise_for_status()
        result = r.json().get("result")
        if result is None:
            return default
        data = json.loads(result)
        return {
            "count": data.get("count", BASE_COUNT),
            "total_words": data.get("total_words", 0),
            "total_time": data.get("total_time", 0.0),
        }
    except Exception:
        return default

def get_essay_count() -> int:
    return get_stats()["count"]

def record_evaluation(word_count: int, elapsed_seconds: float) -> dict:
    stats = get_stats()
    stats["count"] += 1
    stats["total_words"] += word_count
    stats["total_time"] += elapsed_seconds
    if UPSTASH_URL and UPSTASH_TOKEN:
        try:
            httpx.post(
                f"{UPSTASH_URL}/set/{STATS_KEY}",
                headers=_upstash_headers(),
                content=json.dumps(stats),
                timeout=5,
            )
        except Exception:
            pass  # don't fail the essay evaluation just because stats write failed
    return stats


# ─────────────────────────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="EssayLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your Vercel URL once deployed
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model (small English model — fast and free)
nlp = spacy.load("en_core_web_sm")

# Gemini setup — set GEMINI_API_KEY as an environment variable
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

GEMINI_MODEL = "gemini-2.5-flash"  # fast + free-tier friendly


class EssayRequest(BaseModel):
    essay: str


# ─────────────────────────────────────────────────────────────────────────────
# NLP Feature Extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_nlp_features(text: str) -> dict:
    doc = nlp(text)
    sentences = list(doc.sents)
    words = [t.text for t in doc if t.is_alpha]
    word_count = len(words)
    sentence_count = max(len(sentences), 1)

    unique_words = set(w.lower() for w in words)
    lexical_diversity = round(len(unique_words) / word_count, 3) if word_count else 0

    avg_sentence_len = round(word_count / sentence_count, 2)

    flesch_reading_ease = textstat.flesch_reading_ease(text)
    flesch_kincaid_grade = textstat.flesch_kincaid_grade(text)

    passive_count = 0
    for sent in sentences:
        for token in sent:
            if token.dep_ == "nsubjpass":
                passive_count += 1
                break
    passive_ratio = round(passive_count / sentence_count, 3)

    word_freq = {}
    for token in doc:
        if token.is_alpha and not token.is_stop:
            lemma = token.lemma_.lower()
            word_freq[lemma] = word_freq.get(lemma, 0) + 1
    overused = sorted(
        [(w, c) for w, c in word_freq.items() if c >= 4],
        key=lambda x: -x[1]
    )[:5]

    sent_lengths = [len([t for t in s if t.is_alpha]) for s in sentences]
    if len(sent_lengths) > 1:
        mean_len = sum(sent_lengths) / len(sent_lengths)
        variance = sum((l - mean_len) ** 2 for l in sent_lengths) / len(sent_lengths)
        sentence_length_stdev = round(variance ** 0.5, 2)
    else:
        sentence_length_stdev = 0

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": avg_sentence_len,
        "sentence_length_stdev": sentence_length_stdev,
        "lexical_diversity": lexical_diversity,
        "flesch_reading_ease": flesch_reading_ease,
        "flesch_kincaid_grade": flesch_kincaid_grade,
        "passive_voice_ratio": passive_ratio,
        "overused_words": overused,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Gemini Prompting
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt(essay: str, features: dict) -> str:
    return f"""You are an expert college admissions essay evaluator. You will be given a student's essay along with computed linguistic/NLP statistics. Use BOTH the essay content and the statistics to produce a structured evaluation.

ESSAY:
\"\"\"
{essay}
\"\"\"

COMPUTED NLP FEATURES:
- Word count: {features['word_count']}
- Sentence count: {features['sentence_count']}
- Average sentence length: {features['avg_sentence_length']} words
- Sentence length variation (stdev): {features['sentence_length_stdev']}
- Lexical diversity (unique word ratio): {features['lexical_diversity']}
- Flesch Reading Ease: {features['flesch_reading_ease']}
- Flesch-Kincaid Grade Level: {features['flesch_kincaid_grade']}
- Passive voice sentence ratio: {features['passive_voice_ratio']}
- Overused words (lemma, count): {features['overused_words']}

Use the NLP stats as evidence for your judgments where relevant (e.g. cite passive voice ratio or sentence variation when discussing grammar/structure), but your evaluation should be primarily driven by genuine reading of the essay's content, voice, and meaning.

Return ONLY valid JSON, no markdown formatting, no backticks, no preamble. Match this EXACT schema:

{{
  "score": <integer 0-100>,
  "strengths": [<3 short strings>],
  "weaknesses": [<3 short strings>],
  "writing_feedback": {{
    "clarity": "<1-3 sentences>",
    "structure": "<1-3 sentences>",
    "vocabulary": "<1-3 sentences>",
    "grammar": "<1-3 sentences>",
    "reflection_depth": "<1-3 sentences>"
  }},
  "suggestions": [<3-5 specific, actionable strings, including rewrite examples where possible>]
}}"""


def call_gemini(prompt: str) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    raw_text = re.sub(r"^```json\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)
    raw_text = raw_text.strip("`").strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise HTTPException(status_code=502, detail="Gemini returned invalid JSON")


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "EssayLens API is running"}


@app.get("/stats")
def stats():
    s = get_stats()
    avg_time = round(s["total_time"] / s["count"], 1) if s["count"] else 0
    return {
        "essays_reviewed": s["count"],
        "words_analyzed": s["total_words"],
        "avg_analysis_time": avg_time,
    }


@app.post("/evaluate")
def evaluate(request: EssayRequest):
    start_time = time.time()

    essay = request.essay.strip()
    if len(essay) < 100:
        raise HTTPException(status_code=400, detail="Essay too short")

    features = extract_nlp_features(essay)
    prompt = build_prompt(essay, features)
    result = call_gemini(prompt)

    result.setdefault("score", 0)
    result.setdefault("strengths", [])
    result.setdefault("weaknesses", [])
    result.setdefault("writing_feedback", {})
    result.setdefault("suggestions", [])

    elapsed = time.time() - start_time
    record_evaluation(features["word_count"], elapsed)
    return result
