import json
import os
import re
import mimetypes
import time
from typing import Dict, Any, List, Optional
from PIL import Image
from ..config import GEMINI_API_KEY, GEMINI_VISION_MODEL, GEMINI_TEXT_MODEL, BILL_OCR_DEMO_FALLBACK

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


NON_BUSINESS_BILL_KEYWORDS = [
    "hospital", "clinic", "medical bill", "patient", "doctor", "diagnosis", "prescription",
    "school", "college fee", "tuition", "school fee", "university", "admission fee",
    "electricity bill", "power bill", "water bill", "gas bill", "utility bill", "broadband",
    "mobile bill", "phone bill", "internet bill", "property tax", "municipal tax",
    "restaurant bill", "dining", "hotel bill", "travel", "flight", "train ticket",
    "insurance premium", "loan emi", "credit card", "personal expense", "salary slip",
    "rent receipt", "house rent", "maintenance bill", "society maintenance",
]


GEMINI_VISION_MODEL_FALLBACKS = [
    GEMINI_VISION_MODEL,
    "gemini-3.6-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]

GEMINI_TEXT_MODEL_FALLBACKS = [
    GEMINI_TEXT_MODEL,
    "gemini-3.6-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]


class GeminiServiceError(Exception):
    def __init__(self, errors: List[Exception]):
        self.errors = errors
        super().__init__(str(errors[-1]) if errors else "All Gemini models failed")


class AIService:
    def __init__(self):
        self.client = None
        if GEMINI_API_KEY and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
                print(f"[AIService] Successfully initialized Gemini AI Client (Key length: {len(GEMINI_API_KEY)})")
            except Exception as e:
                print(f"[AIService Warning] Could not initialize Gemini Client: {e}")
        else:
            print(f"[AIService Info] GEMINI_API_KEY present: {bool(GEMINI_API_KEY)}, genai library installed: {GENAI_AVAILABLE}")

    def _unique_models(self, models: List[str]) -> List[str]:
        seen = set()
        ordered = []
        for model in models:
            name = (model or "").strip()
            if name and name not in seen:
                seen.add(name)
                ordered.append(name)
        return ordered

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        txt = text.strip()
        if txt.startswith("```json"):
            txt = txt[7:]
        elif txt.startswith("```"):
            txt = txt[3:]
        if txt.endswith("```"):
            txt = txt[:-3]
        txt = txt.strip()
        start = txt.find("{")
        end = txt.rfind("}")
        if start != -1 and end != -1 and end > start:
            txt = txt[start:end + 1]
        return json.loads(txt)

    def _image_mime_type(self, image_path: str) -> str:
        mime_type, _ = mimetypes.guess_type(image_path)
        return mime_type or "image/jpeg"

    def _is_quota_error(self, err: Exception) -> bool:
        text = str(err).lower()
        return "429" in text or "resource_exhausted" in text or "quota" in text

    def _errors_include_quota(self, errors: List[Exception]) -> bool:
        return any(self._is_quota_error(err) for err in errors)

    def _is_model_not_found_error(self, err: Exception) -> bool:
        text = str(err).lower()
        return "404" in text or "not_found" in text or "not found" in text

    def _generate_vision_json(self, image_path: str, prompt: str) -> Dict[str, Any]:
        if not self.client:
            raise RuntimeError("Gemini client is not configured")

        with open(image_path, "rb") as image_file:
            image_bytes = image_file.read()

        mime_type = self._image_mime_type(image_path)
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ]

        last_error = None
        collected_errors: List[Exception] = []
        for model in self._unique_models(GEMINI_VISION_MODEL_FALLBACKS):
            for attempt in range(2):
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                        ),
                    )
                    parsed = self._parse_json_response(response.text)
                    print(f"[AIService] Bill OCR succeeded with model: {model}")
                    return parsed
                except Exception as err:
                    last_error = err
                    collected_errors.append(err)
                    if self._is_quota_error(err) and attempt == 0:
                        print(f"[AIService] Quota/rate limit on '{model}', retrying once...")
                        time.sleep(2)
                        continue
                    print(f"[AIService] Vision model '{model}' failed: {err}")
                    break

        raise GeminiServiceError(collected_errors or ([last_error] if last_error else []))

    def _generate_text_json(self, prompt: str) -> Dict[str, Any]:
        if not self.client:
            raise RuntimeError("Gemini client is not configured")

        last_error = None
        for model in self._unique_models(GEMINI_TEXT_MODEL_FALLBACKS):
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=[prompt],
                )
                parsed = self._parse_json_response(response.text)
                print(f"[AIService] Text generation succeeded with model: {model}")
                return parsed
            except Exception as err:
                last_error = err
                print(f"[AIService] Text model '{model}' failed: {err}")

        raise RuntimeError(str(last_error) if last_error else "All Gemini text models failed")

    def _ocr_failure_payload(self, err: Optional[Exception] = None) -> Dict[str, Any]:
        errors: List[Exception] = []
        if isinstance(err, GeminiServiceError):
            errors = err.errors
        elif err is not None:
            errors = [err]

        combined = " ".join(str(e) for e in errors).lower()

        if self._errors_include_quota(errors) or "429" in combined or "quota" in combined:
            return {
                "ocr_error": True,
                "message": (
                    "AI bill scanning quota is temporarily exceeded. Please wait a minute and try again, "
                    "or verify your Gemini API key billing/plan at https://aistudio.google.com/apikey."
                ),
            }
        if errors and all(self._is_model_not_found_error(e) for e in errors):
            return {
                "ocr_error": True,
                "message": (
                    "AI bill scanning model is unavailable. Please set GEMINI_VISION_MODEL=gemini-2.5-flash-lite "
                    "in backend/.env and restart the server."
                ),
            }
        if "api key" in combined or "permission" in combined or "unauthorized" in combined:
            return {
                "ocr_error": True,
                "message": (
                    "Bill scanning is unavailable due to an invalid or missing Gemini API key. "
                    "Please set GEMINI_API_KEY in backend/.env and restart the server."
                ),
            }

        return {
            "ocr_error": True,
            "message": (
                "Could not read this bill image. Please upload a clear, well-lit photo of your "
                "wholesale or retail purchase invoice and try again."
            ),
        }

    def _demo_fallback_extract(self, image_path: str) -> Dict[str, Any]:
        """
        Last-resort demo extraction when Gemini is unavailable.
        Still runs business validation heuristics on any available metadata.
        """
        filename = os.path.basename(image_path).lower()
        blob = filename.replace("_", " ").replace("-", " ")

        for keyword in NON_BUSINESS_BILL_KEYWORDS:
            if keyword in blob:
                return {
                    "is_business_related": False,
                    "document_type": keyword.title(),
                    "rejection_reason": (
                        f"This document looks like a personal or non-business bill ({keyword}). "
                        "Hospital bills, school fees, utility bills, and similar documents cannot be uploaded."
                    ),
                }

        sample = self._sample_bill_data()
        sample["supplier_name"] = "Uploaded Wholesale Purchase Bill"
        sample["notes"] = "Demo OCR fallback used because Gemini API was unavailable"
        sample["total_amount"] = 15450.0
        sample["items"] = sample["items"][:3]
        return sample

    def _sample_bill_data(self) -> Dict[str, Any]:
        return {
            "is_business_related": True,
            "supplier_name": "Metro Cash & Carry India Ltd.",
            "purchase_date": "2026-08-01",
            "total_amount": 48000.0,
            "items": [
                {"product_name": "Bisleri Water Bottles (1L x 24)", "category": "Beverages", "quantity": 10, "cost_price": 240.0, "total_price": 2400.0},
                {"product_name": "Coca-Cola 750ml (Pack of 12)", "category": "Beverages", "quantity": 15, "cost_price": 450.0, "total_price": 6750.0},
                {"product_name": "Lay's Classic Salted Chips (Large)", "category": "Snacks", "quantity": 25, "cost_price": 180.0, "total_price": 4500.0},
                {"product_name": "Britannia Good Day Biscuits (Pack)", "category": "Snacks", "quantity": 20, "cost_price": 300.0, "total_price": 6000.0},
                {"product_name": "Fortune Sunlite Sunflower Oil 1L", "category": "Groceries", "quantity": 30, "cost_price": 140.0, "total_price": 4200.0},
            ],
        }

    def _bill_text_blob(self, extracted: Dict[str, Any]) -> str:
        parts = [
            extracted.get("supplier_name", ""),
            extracted.get("document_type", ""),
            extracted.get("rejection_reason", ""),
        ]
        for item in extracted.get("items", []):
            parts.extend([
                item.get("product_name", ""),
                item.get("category", ""),
            ])
        return " ".join(str(p) for p in parts if p).lower()

    def validate_business_bill(self, extracted: Dict[str, Any]) -> tuple[bool, str]:
        """
        Returns (is_valid, rejection_message).
        Uses AI flag first, then keyword heuristics on extracted text.
        """
        if extracted.get("is_business_related") is False:
            if extracted.get("rejection_reason"):
                return False, str(extracted["rejection_reason"])
            reason = extracted.get("document_type") or "non-business document"
            return False, (
                f"This document appears to be a {reason}. "
                "Only wholesale or retail inventory purchase bills for your store are allowed."
            )

        blob = self._bill_text_blob(extracted)
        for keyword in NON_BUSINESS_BILL_KEYWORDS:
            if keyword in blob:
                return False, (
                    f"This document looks like a personal or non-business bill ({keyword}). "
                    "Hospital bills, school fees, utility bills, and similar documents cannot be uploaded."
                )

        items = extracted.get("items") or []
        business_categories = {
            "beverages", "snacks", "groceries", "grocery", "dairy", "personal care",
            "household", "stationery", "medicines", "pharmacy", "bakery", "confectionery",
            "cleaning", "detergent", "grains", "oil", "healthcare", "hygiene", "supplements",
            "first aid", "devices", "general", "inventory", "wholesale", "fmcg",
        }
        if items:
            non_business_item_hits = sum(
                1 for item in items
                if any(kw in str(item.get("product_name", "")).lower() for kw in NON_BUSINESS_BILL_KEYWORDS)
            )
            if non_business_item_hits == len(items):
                return False, (
                    "The line items on this document do not appear to be store inventory purchases. "
                    "Please upload a wholesale or retail stock purchase invoice."
                )

            category_hits = [
                str(item.get("category", "")).lower().strip()
                for item in items
                if str(item.get("category", "")).strip()
            ]
            if category_hits and not any(
                any(cat in hit or hit in cat for cat in business_categories)
                for hit in category_hits
            ):
                return False, (
                    "This document does not contain recognizable store inventory categories. "
                    "Only business purchase bills for stock and inventory are accepted."
                )

        return True, ""

    def scan_bill_image(self, image_path: str) -> Dict[str, Any]:
        """
        Uses Gemini Vision AI to parse supplier details and itemized products from a bill image.
        Returns structured JSON with supplier, date, total amount, and items list.
        """
        is_real_upload = bool(image_path and os.path.isfile(image_path))

        if self.client and is_real_upload:
            try:
                prompt = (
                    "You are validating and extracting data from a retail store owner's purchase invoice image. "
                    "STEP 1 — Classify the document. It MUST be a wholesale/retail inventory purchase bill "
                    "(stock bought for resale in a kirana store, pharmacy, bakery, or supermarket). "
                    "REJECT and set is_business_related to false if the document is ANY of these: "
                    "hospital or clinic bill, medical treatment invoice, school/college/university fee receipt, "
                    "tuition fee, electricity/water/gas/utility bill, mobile or broadband bill, "
                    "restaurant or hotel bill, travel ticket, insurance premium, loan EMI, rent receipt, "
                    "salary slip, personal expense, or any document unrelated to store inventory purchases. "
                    "STEP 2 — If rejected, still return JSON with is_business_related=false, "
                    "document_type (short label e.g. 'Hospital Bill'), and rejection_reason (one sentence). "
                    "STEP 3 — If accepted, extract purchase details. "
                    "Return ONLY valid JSON with keys: "
                    '"is_business_related" (boolean), "document_type" (string), "rejection_reason" (string or null), '
                    '"supplier_name" (string), "purchase_date" (YYYY-MM-DD or string), '
                    '"total_amount" (number), "items" (array of objects with "product_name", '
                    '"category", "quantity", "cost_price", "total_price").'
                )
                parsed = self._generate_vision_json(image_path, prompt)
                is_valid, rejection_msg = self.validate_business_bill(parsed)
                if not is_valid:
                    parsed["is_business_related"] = False
                    parsed["rejection_reason"] = rejection_msg
                return parsed
            except Exception as err:
                print(f"[AIService Gemini OCR Error] {err}.")
                if BILL_OCR_DEMO_FALLBACK:
                    print("[AIService] Using demo OCR fallback because BILL_OCR_DEMO_FALLBACK is enabled.")
                    return self._demo_fallback_extract(image_path)
                return self._ocr_failure_payload(err)

        if not is_real_upload:
            return self._sample_bill_data()

        return self._ocr_failure_payload(RuntimeError("Gemini client is not configured"))

    def scan_shelf_image(self, image_path: str) -> Dict[str, Any]:
        """
        Uses Gemini Vision AI for Object Detection & Product Classification on shelf images.
        """
        if self.client:
            try:
                img = Image.open(image_path)
                prompt = (
                    "Perform object detection and product counting on this retail store shelf image. "
                    "Return ONLY valid JSON with keys: "
                    '"total_items_detected" (number), "stock_health_score" (number 0-100), '
                    '"items" (array of objects with "product_name", "category", "quantity_detected", '
                    '"min_required", "max_threshold", "estimated_unit_price", "stock_status" ("Low Stock"|"Optimal"|"Overstocked"), '
                    '"turnover_speed" ("Fast Moving"|"Slow Moving"|"Dead Stock")).'
                )
                response = self.client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=[img, prompt]
                )
                txt = response.text.strip()
                if txt.startswith("```json"):
                    txt = txt[7:]
                if txt.endswith("```"):
                    txt = txt[:-3]
                return json.loads(txt.strip())
            except Exception as err:
                print(f"[AIService Gemini Shelf Vision Error] {err}. Using mock fallback.")

        return {
            "total_items_detected": 137,
            "stock_health_score": 82.5,
            "items": [
                { "product_name": "Soft Drinks (750ml Cans)", "category": "Beverages", "quantity_detected": 40, "min_required": 50, "max_threshold": 120, "estimated_unit_price": 45.0, "stock_status": "Low Stock", "turnover_speed": "Fast Moving" },
                { "product_name": "Water Bottles 1L", "category": "Beverages", "quantity_detected": 35, "min_required": 40, "max_threshold": 100, "estimated_unit_price": 20.0, "stock_status": "Low Stock", "turnover_speed": "Fast Moving" }
            ]
        }

    def generate_market_intelligence(self, business_info: Dict[str, Any], locality_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates locality market opportunities, competitor analysis, and AI insights.
        """
        b_name = business_info.get("business_name", "Local Store")
        b_cat = business_info.get("category", "Kirana Store")
        area = locality_info.get("area_name", "Main Market")
        city = locality_info.get("city", "City")
        colleges = locality_info.get("nearby_colleges", 1)
        schools = locality_info.get("nearby_schools", 2)
        offices = locality_info.get("nearby_offices", 5)

        if self.client:
            try:
                prompt = f"""
                Analyze the business profile and locality for:
                Business: {b_name} ({b_cat}) located in {area}, {city}.
                Nearby: {schools} schools, {colleges} colleges, {offices} corporate offices.
                Target customers: {locality_info.get('target_customer_segment', 'General public')}.

                Provide structured Market Intelligence in JSON format with:
                "ai_insight" (string summary),
                "market_opportunity_score" (number 0-100),
                "recommendations" (list of objects with "title", "description", "category", "impact_level"),
                "high_demand_categories" (list of strings).
                """
                response = self.client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=[prompt]
                )
                txt = response.text.strip()
                if txt.startswith("```json"):
                    txt = txt[7:]
                if txt.endswith("```"):
                    txt = txt[:-3]
                return json.loads(txt.strip())
            except Exception as e:
                print(f"[AIService Market Intel Gemini Error] {e}")

        is_student_area = colleges > 0 or schools > 1
        insight_text = (
            f"High demand potential for health drinks, energy beverages, instant snacks, "
            f"stationery items, and OTC healthcare products due to nearby student and office worker density ({colleges} colleges, {offices} offices)."
            if is_student_area else
            f"Strong local residential demand for daily essentials, fresh dairy, and premium snacking items in {area}."
        )

        return {
            "ai_insight": insight_text,
            "market_opportunity_score": 88.0,
            "high_demand_categories": ["Cool Drinks & Energy Beverages", "Ready-to-eat Snacks", "Stationery & Notebooks", "Personal Care"],
            "recommendations": [
                {
                    "title": "Student & Office Snack Combo Station",
                    "category": "Locality",
                    "impact_level": "High",
                    "description": f"Create discount snack+beverage combos for evening peak hours (5 PM - 9 PM) targeting nearby {colleges} colleges and {offices} offices.",
                    "action_item": "Bundle 750ml Cool Drink + Chips pack with 10% combo discount."
                }
            ]
        }

    def answer_assistant_query(self, query: str, context_data: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        """
        Answers natural language business questions using context (ledger, inventory, profile).
        Strictly enforces business domain boundaries, differentiates greetings from business queries,
        and NEVER returns mismatched inventory data for casual or unwanted questions.
        """
        q_lower = query.lower().strip()
        is_telugu = (language == "te") or bool(re.search(r'[\u0C00-\u0C7F]', query))

        # 1. Strict Out-of-Scope Standard Refusal Payloads
        strict_refusal_en = {
            "analysis": "I do not understand what you are saying. I am your Vyapaar Mithra AI assistant and can only help with your business, inventory, bill ledger, sales forecasts, and market intelligence.",
            "reasons": [
                "Your question appears to be outside the scope of retail business and store management.",
                "I am strictly trained to assist with your store's inventory, bill ledger, revenue analysis, demand forecasts, and market intelligence."
            ],
            "recommendations": [
                "Please ask a question regarding your store inventory, low stock items, wholesale bills, or profit margins."
            ]
        }

        strict_refusal_te = {
            "analysis": "నాకు మీరు చెప్పేది అర్థం కావడం లేదు. నేను మీ వ్యాపార మిత్ర AI సహాయకుడిని. నేను మీ వ్యాపారం, ఇన్వెంటరీ, బిళ్ళల నిల్వ, అమ్మకాల అంచనాలు మరియు మార్కెట్ సమాచారానికి మాత్రమే సహాయపడగలను.",
            "reasons": [
                "మీ ప్రశ్న వ్యాపార నిర్వహణ మరియు స్టోర్ నివేదికల పరిధికి బయట ఉంది.",
                "నేను కేవలం మీ స్టోర్ ఇన్వెంటరీ స్టాక్, కొనుగోలు బిళ్లు, నికర లాభాలు మరియు డిమాండ్ అంచనాలకు మాత్రమే సహాయపడతాను."
            ],
            "recommendations": [
                "దయచేసి మీ స్టోర్ అమ్మకాలు, సరుకుల నిల్వ, లాభాల మార్జిన్లు లేదా ఆర్డర్ల గురించిన ప్రశ్నలు అడగండి."
            ]
        }

        active_refusal = strict_refusal_te if is_telugu else strict_refusal_en

        # 2. Greetings / Polite Conversation Patterns (DO NOT dump inventory metrics)
        greeting_patterns = [
            r'\bhow are you\b', r'\bhow r u\b', r'\bhow are u\b', r'\bhow do you do\b', r'\bhow are you doing\b',
            r'\bwho are you\b', r'\bwhat is your name\b', r'\bwhat can you do\b', r'\bhello\b', r'\bhi\b', r'\bhey\b',
            r'\bgood morning\b', r'\bgood afternoon\b', r'\bgood evening\b',
            r'ఎలా ఉన్నారు', r'ఎలా ఉన్నావు', r'బాగున్నారా', r'నమస్తే', r'నమస్కారం', r'మీరు ఎవరు', r'మీ పేరు ఏమిటి'
        ]

        is_greeting = any(re.search(pat, q_lower) for pat in greeting_patterns)

        if is_greeting:
            if is_telugu:
                return {
                    "analysis": "నమస్కారం! నేను బాగున్నాను, ధన్యవాదాలు. నేను మీ వ్యాపార మిత్ర AI వర్చువల్ బిజినెస్ సహాయకుడిని.",
                    "reasons": [
                        "మీ స్టోర్ ఇన్వెంటరీ నిల్వలు, హోల్‌సేల్ కొనుగోలు బిళ్లు మరియు నికర లాభాలను విశ్లేషించడానికి నేను సిద్ధంగా ఉన్నాను."
                    ],
                    "recommendations": [
                        "నన్ను 'నేను ఏ ఉత్పత్తులను రీఆర్డర్ చేయాలి?', 'నా లాభం ఎంత?', లేదా 'ఏ సరుకులు నెమ్మదిగా అమ్ముడవుతున్నాయి?' అని అడగండి."
                    ]
                }
            else:
                return {
                    "analysis": "Hello! I am doing well, thank you. I am Vyapaar Mithra AI, your virtual business intelligence consultant.",
                    "reasons": [
                        "I can analyze your wholesale investment bills, shelf inventory levels, sales velocity, and locality demand."
                    ],
                    "recommendations": [
                        "Ask me questions like 'Which products should I reorder?', 'Why did profit change?', or 'What should I invest in next month?'"
                    ]
                }

        # 3. Explicit Off-Topic / Unwanted Query Patterns
        off_topic_patterns = [
            r'\bjoke\b', r'\bstory\b', r'\bmovie\b', r'\bweather\b', r'\bpython\b', r'\bcode\b',
            r'\bprogramming\b', r'\bcapital of\b', r'\bwho is\b', r'\bwho won\b', r'\brecipe\b',
            r'\bsport\b', r'\bcricket\b', r'\bfootball\b', r'\bsong\b', r'\bmusic\b', r'\bgame\b',
            r'\bpoem\b', r'\bessay\b', r'\bhomework\b', r'\bmath\b', r'\bphysics\b', r'\bchemistry\b',
            r'\bpolitics\b', r'\bpresident\b', r'\bprime minister\b', r'\bhacks\b'
        ]

        for pattern in off_topic_patterns:
            if re.search(pattern, q_lower):
                return active_refusal

        # 4. Strict Allowed Business Keywords Check
        business_keywords = [
            "profit", "revenue", "margin", "sale", "sales", "invest", "investment", "budget", "money",
            "bill", "bills", "ledger", "supplier", "suppliers", "purchase", "purchases", "cost", "price",
            "inventory", "stock", "shelf", "shelves", "product", "products", "item", "items", "category",
            "reorder", "buy", "buying", "sell", "selling", "turnover", "fast moving", "slow moving",
            "low stock", "overstocked", "dead stock", "forecast", "prediction", "predict", "demand",
            "customer", "customers", "locality", "competitor", "market", "store", "shop", "kirana",
            "pharmacy", "bakery", "supermarket", "business", "onboarding", "profile", "employee",
            "rupee", "rs", "₹", "order", "orders", "discount", "wholesale", "retail", "peak hours",
            "performance", "growth",
            "లాభం", "అమ్మకాలు", "సరుకులు", "స్టాక్", "బిళ్లు", "రీఆర్డర్", "వ్యాపారం", "పెట్టుబడి", "రసీదు"
        ]

        is_business = any(kw in q_lower for kw in business_keywords)
        if not is_business:
            return active_refusal

        # 5. Gemini LLM Call with Strict Instruction Guard
        if self.client:
            try:
                lang_instruction = (
                    "CRITICAL LANGUAGE INSTRUCTION: The user wants responses in TELUGU (తెలుగు) language. "
                    "You MUST respond with analysis, reasons, and recommendations strictly in clear, natural Telugu script (తెలుగు లిపి)."
                    if is_telugu else
                    "Respond in clear, professional English."
                )

                prompt = f"""
                You are Vyapaar Mithra AI, a strict business intelligence assistant for a retail store owner.
                Business context: {json.dumps(context_data)}
                User Query: "{query}"
                Language Requested: {"Telugu (తెలుగు)" if is_telugu else "English"}

                {lang_instruction}

                STRICT DOMAIN SCOPE DIRECTIVE:
                You MUST ONLY answer questions that are directly related to the user's business, store management, inventory, purchase bills, financial metrics, sales forecasts, or locality market intelligence.
                If the user asks ANYTHING outside of store and business intelligence (such as general trivia, jokes, coding, weather, sports, movies, personal questions, recipes, or non-business topics):
                Return the exact out of scope refusal json with:
                "analysis": "{strict_refusal_te['analysis'] if is_telugu else strict_refusal_en['analysis']}",
                "reasons": ["{strict_refusal_te['reasons'][0] if is_telugu else strict_refusal_en['reasons'][0]}"],
                "recommendations": ["{strict_refusal_te['recommendations'][0] if is_telugu else strict_refusal_en['recommendations'][0]}"]

                Otherwise, if the question IS business-related, respond in valid JSON format with:
                "analysis" (string summarizing overall finding),
                "reasons" (array of bullet point strings explaining why),
                "recommendations" (array of actionable advice strings).
                Do not include markdown bullet markers like '-' or '*'.
                """
                response = self.client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=[prompt]
                )
                txt = response.text.strip()
                if txt.startswith("```json"):
                    txt = txt[7:]
                if txt.endswith("```"):
                    txt = txt[:-3]
                data = json.loads(txt.strip())

                def _clean_str(s):
                    if not isinstance(s, str):
                        return s
                    s = re.sub(r'^\s*[\-\•]\s*', '', s)
                    s = re.sub(r'^\s*\*\s+', '', s)
                    s = re.sub(r'^\s*\*([^\*]+)\*\*', r'**\1**', s)
                    return s.strip()

                if isinstance(data.get("analysis"), str):
                    data["analysis"] = _clean_str(data["analysis"])
                if isinstance(data.get("reasons"), list):
                    data["reasons"] = [_clean_str(r) for r in data["reasons"]]
                if isinstance(data.get("recommendations"), list):
                    data["recommendations"] = [_clean_str(r) for r in data["recommendations"]]

                # Double check response text for strict refusal alignment
                if "do not understand" in data.get("analysis", "").lower() or "అర్థం కావడం లేదు" in data.get("analysis", "") or "outside the scope" in str(data.get("reasons", "")).lower():
                    return active_refusal

                return data
            except Exception as err:
                print(f"[AIService Chat Gemini Error] {err}")

        # 6. Rule-based Multilingual Fallback Responses for Specific Business Queries
        if is_telugu:
            if any(k in q_lower for k in ["లాభం", "profit", "తగ్గింది", "revenue"]):
                return {
                    "analysis": "గత నెలతో పోలిస్తే ఈ నెల అంచనా నికర లాభం 7% తగ్గింది.",
                    "reasons": [
                        "పాల ఉత్పత్తులు మరియు బిస్కెట్ వర్గాల సప్లయర్ ధరలు 4.5% పెరిగాయి.",
                        "బిస్కెట్ ఇన్వెంటరీ నిల్వలు నెమ్మదిగా అమ్ముడవుతున్నాయి.",
                        "సాయంత్రం గరిష్ట అమ్మకాల సమయంలో పానీయాల నిల్వ తక్కువగా ఉంది."
                    ],
                    "recommendations": [
                        "ప్రస్తుత నిల్వ తగ్గే వరకు బిస్కెట్ ఆర్డర్లను 30% తగ్గించండి.",
                        "వారాంతానికి ముందు చల్లని పానీయాల స్టాక్‌ను 40% పెంచండి.",
                        "హోల్‌సేల్ పెంపకందారులతో కొనుగోలు తగ్గింపు కొరకు చర్చించండి."
                    ]
                }
            elif any(k in q_lower for k in ["రీఆర్డర్", "సరుకులు", "స్టాక్", "reorder", "buy", "stock"]):
                return {
                    "analysis": "మీ అత్యధిక డిమాండ్ ఉన్న 2 వర్గాలకు వెంటనే రీఆర్డర్ చేయడం అవసరం.",
                    "reasons": [
                        "సాఫ్ట్ డ్రింక్స్ స్టాక్ కనీస పరిమితి కంటే తక్కువగా ఉంది.",
                        "మంచినీళ్ల బాటిళ్లు 2 రోజుల్లో పూర్తవుతాయని అంచనా."
                    ],
                    "recommendations": [
                        "వెంటనే 50 అదనపు కూల్ డ్రింక్స్ బాటిళ్లను ఆర్డర్ చేయండి.",
                        "శుక్రవారం సాయంత్రంలోగా 40 మంచినీళ్ల బాటిళ్లను తెప్పించండి."
                    ]
                }
            elif any(k in q_lower for k in ["నెమ్మదిగా", "slow"]):
                return {
                    "analysis": "నెమ్మదిగా అమ్ముడవుతున్న మరియు అదనపు హోల్డింగ్ వ్యయం ఉన్న ఉత్పత్తులను గుర్తించాము.",
                    "reasons": [
                        "బిస్కెట్ ప్యాక్‌ల అమ్మకాల వేగం స్నాక్స్ కంటే 40% తక్కువగా ఉంది.",
                        "ప్రస్తుత కాలంలో నోట్‌బుక్స్ స్టాక్ నిల్వ ఎక్కువగా ఉంది."
                    ],
                    "recommendations": [
                        "బిస్కెట్ ప్యాక్‌లపై 10% తగ్గింపును అందించండి.",
                        "వేగంగా అమ్ముడయ్యే సాఫ్ట్ డ్రింక్స్‌ను ముందు షెల్ఫ్‌కు మార్చండి."
                    ]
                }

            return active_refusal

        # English Fallbacks
        if "profit" in q_lower or "decreasing" in q_lower or "revenue" in q_lower:
            return {
                "analysis": "Estimated net profit decreased by 7% this month compared to last month.",
                "reasons": [
                    "Supplier cost prices increased by 4.5% across packaged dairy and biscuit categories.",
                    "Overstocked biscuit inventory sitting idle (30+ units remaining with slow turnover speed).",
                    "Understocking of fast-moving cold beverages during peak evening sales hours."
                ],
                "recommendations": [
                    "Reduce biscuit reorders by 30% until current shelf stock drops below 15 units.",
                    "Increase beverage and cold water inventory by 40% before the weekend.",
                    "Negotiate bulk purchase discount with primary distributor."
                ]
            }

        elif "reorder" in q_lower or "buy" in q_lower or "stock" in q_lower or "inventory" in q_lower:
            return {
                "analysis": "Immediate inventory reorder is recommended for your high-turnover categories.",
                "reasons": [
                    "Soft Drinks inventory is down below minimum safety threshold.",
                    "Water Bottles are predicted to exhaust in 2 days based on local customer demand."
                ],
                "recommendations": [
                    "Order 50 additional cool drink bottles immediately.",
                    "Order 40 units of 1L Water Bottles before Friday evening.",
                    "Pause reordering overstocked items until current inventory clears."
                ]
            }

        elif "slow" in q_lower or "dead" in q_lower:
            return {
                "analysis": "Identified product categories with slow turnover and excess holding cost.",
                "reasons": [
                    "Assorted Biscuit Packs turnover velocity is 40% lower than snacks.",
                    "Stationery notebooks have high stock density relative to current summer period."
                ],
                "recommendations": [
                    "Offer 10% discount on biscuit packs expiring within 60 days.",
                    "Relocate fast-moving chips and soft drinks to front shelf counter."
                ]
            }

        elif "invest" in q_lower or "next month" in q_lower or "budget" in q_lower:
            return {
                "analysis": "Recommended capital allocation strategy for your monthly budget.",
                "reasons": [
                    "Beverages & Soft Drinks deliver your highest gross profit margin (32%).",
                    "Nearby college student and office density will boost demand for cold drinks & snacks."
                ],
                "recommendations": [
                    "Allocate 45% of investment budget to beverages & cold drinks.",
                    "Allocate 30% to daily grocery essentials.",
                    "Reserve 25% for high-margin student snacks & packaged chocolates."
                ]
            }

        return active_refusal


ai_service = AIService()
