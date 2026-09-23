# Project Information: Argus AML

## Overview
Argus AML is an AI-assisted investigative platform for reviewing financial transaction networks in the context of green financing and anti-money laundering compliance. The project helps analysts examine how funds move between a target entity and its counterparties, identify suspicious patterns, and support decisions about whether a case should proceed to Suspicious Activity Report (SAR) review, enhanced due diligence, or no action.

The system is designed to be both analytical and transparent. It combines network graph analysis, relationship scoring, role classification, and investigator-facing explanations so that risk signals are easier to understand and justify.

## Project purpose
The platform is intended to help financial institutions:
- analyze complex transaction networks across multiple entities
- detect possible layering, pass-through movement, circular flows, and unusual routing
- identify potential gatekeepers, mules, and ultimate beneficial owners
- assess whether a green-financing application or associated flow shows elevated compliance risk
- support SAR-related review decisions with evidence-backed explanations

## What the product does
Argus AML processes transaction data and turns it into a visual and analytical network model. From that model, it can:
- build directed transaction graphs from source and destination accounts
- identify network signals such as cycles, shared addresses, exclusion exposure, and high-volume pass-through behavior
- estimate relationship risk for direct and inferred edges
- classify the case as SAR filing required, enhanced due diligence, or no action required
- present the results through an interactive frontend experience

## About this tool
The application’s public “About” framing describes it as a tool for “transparent relationship scoring for transaction-network investigations.” It focuses on explainability rather than black-box outputs, giving investigators access to the reasoning behind each score and recommendation.

## Core workflow
1. Data intake
   - Transaction data is supplied through consolidated monthly JSON files.
   - The system organizes this data into scenario batches for analysis.

2. Scenario generation
   - The backend prepares scenarios from the monthly dataset so each disconnected component can be reviewed independently.

3. Graph construction
   - Accounts and entities become nodes.
   - Transactions become directed edges with transaction amount, relationship type, and other metadata.

4. Signal extraction and role analysis
   - The system looks for suspicious patterns and identifies likely intermediary or beneficiary roles.
   - These include gatekeepers, mules, and UBO-style beneficiaries.

5. Relationship scoring and classification
   - Direct and inferred relationships receive scores.
   - The orchestration layer uses those scores to determine an investigation outcome.

## Key technical architecture
### Frontend
The frontend is a React-based interface that provides:
- a scenario overview page
- a detailed scenario analysis view
- interactive network graph visualization
- relationship score details
- SAR recommendations and explanations

### Backend
The backend is built with FastAPI and exposes endpoints for:
- listing scenarios and batches
- analyzing a scenario
- generating SAR reports
- retrieving relationship score data

### Data layer
The project stores data under the repository’s data folder, including:
- monthly consolidated datasets
- batched scenario files
- anonymized sample investigation cases

## Analysis logic
### Direct edge scoring
The direct relationship score uses a capped additive formula:

score = min(1.0, cycle + shared_address + exclusion + pass_through + (type_weight × 0.15))

This means that direct edges become more suspicious when they are part of circular movement, involve shared address clusters, connect to excluded entities, show pass-through retention, or map to a higher-risk relationship type.

### Inferred edge scoring
Inferred pass-through relationships use a separate confidence formula:

confidence = min(1.0, (ratio × 0.45) + timing + hop + mule + identifier_match)

This captures how strongly the evidence supports an inferred rapid onward movement between entities.

## Risk interpretation
The user-facing score guidance is defined as follows:
- 0.00–0.29: Low risk
- 0.30–0.59: Moderate risk
- 0.60–0.74: Elevated risk
- 0.75–1.00: High risk

Higher scores suggest a stronger need for investigator review, deeper due diligence, or reporting assessment.

## Project context and team identity
The repository is associated with “AI Intelligence Network Team Delta.” The project sits at the intersection of financial crime analysis, graph analytics, and applied AI, with a specific emphasis on green financing compliance and suspicious transaction pattern detection.

## Summary
Argus AML is a practical decision-support system for compliance and investigation teams. It combines transaction-network analysis, transparent scoring, and rule-based recommendations to help reviewers focus on the most suspicious patterns and justify their next steps.
