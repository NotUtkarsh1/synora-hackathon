# synora-hackathon
This is the problem statement that me and my team together tried to solve is  

Holistic Health & Wellness Agent
Merges: Chronic Health Monitoring & Symptom Triage Agent + Personal Wellness Coach (Fitness + Nutrition)
THE CHALLENGE
Construct a comprehensive health agent combining proactive fitness/nutrition coaching with safe medical triage and
chronic condition tracking.
CONTEXT & BUSINESS IMPACT
Digital health applications frequently operate in silos, isolating lifestyle/wellness coaching from clinical triage and chronic
disease management. A unified agent must bridge this gap while enforcing clinical safety boundaries, non-diagnostic
guardrails, and real-time biometric anomaly detection.
KEY FUNCTIONAL & TECHNICAL REQUIREMENTS
● Clinical Safety & Escalation: Explicit urgency framing; non-diagnostic outputs; clear referral triggers.
● Intent Routing: Dynamic routing between wellness coaching and clinical triage on ambiguous inputs.
● Multimodal Meal Recognition: Real food photo analysis via Vision LLMs/VLMs.
● Constraint Enforcement: Health condition parameters must override general wellness recommendations.
Sensor Anomaly Detection: Real-time anomaly detection layer operating on synthetic wearable sensor data.
SUGGESTED ARCHITECTURE & TECH STACK
Open LLMs with Clinical RAG (BioMistral / Med-PaLM / PubMed Retriever), Vision-Language Models (LLaVA / GPT-4V),
Wearable Stream Processor (Kafka / Flink / Python Anomaly Detector), React Native / Flutter.
MENTOR EVALUATION GUIDELINES
Verify clinical safety rails (refusal to diagnose, mandatory escalation triggers), deterministic intent classification, accuracy of
macro estimation from meal imagery, and latency in anomaly alert generation from biometric streams.
