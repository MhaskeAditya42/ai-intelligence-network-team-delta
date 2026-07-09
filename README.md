# 🌱 Network Intelligence Framework for Green Financing

A sophisticated AI-powered financial network analysis platform designed to enable financial institutions to assess risk and compliance requirements for companies applying for Green Financing Loans.

## 📋 Overview

The **Network Intelligence Framework** is an advanced analytical system that processes transactional data to identify suspicious patterns, evaluate financial relationships, and determine regulatory compliance requirements. By analyzing the network of transactions between a target client and their connected entities, the framework provides comprehensive risk assessments and actionable recommendations for Suspicious Activity Report (SAR) filing decisions.

### Key Purpose

This framework enables banks and financial institutions to:
- **Analyze Complex Financial Networks**: Process and visualize transaction relationships across multiple entities
- **Detect Risk Patterns**: Identify suspicious activities and high-risk relationships through graph-based analysis
- **Assess Compliance Requirements**: Determine whether SAR Filing, Enhanced Due Diligence, or No Action is required
- **Support Green Financing Decisions**: Make informed lending decisions for green financing applications
- **Visualize Relationships**: Present complex financial networks in an easy-to-understand interactive format

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 19 with Bootstrap 5
- **Graph Visualization**: react-force-graph-2d (Force-directed graph rendering)
- **API Communication**: Axios
- **Routing**: React Router DOM v7
- **UI Framework**: Bootstrap 5.3 with responsive design

---

## 🧩 Component Architecture

### Core Components

#### 1. **Header Component** (`Header.jsx`)
Provides application branding and navigation.
- **Features**:
  - Application title with green financing badge (🌱)
  - Responsive navigation menu (Home, About, Contact)
  - Mobile-responsive hamburger menu
  - Dark professional styling
- **Purpose**: Consistent navigation and branding across all pages

#### 2. **HomePage Component** (`HomePage.jsx`)
Landing page displaying all available analysis scenarios.
- **Features**:
  - Responsive grid layout using Bootstrap (6-col on large, 12-col on mobile)
  - Loading state with spinner indicator
  - Descriptive header and introduction
  - Display-5 typography for professional appearance
  - Navigation to detailed scenario analysis
- **Purpose**: Provides users access to all scenarios

#### 3. **ScenarioDetailPage Component** (`ScenarioDetailPage.jsx`)
Comprehensive analysis dashboard for a selected scenario.
- **Layout**:
  - 8-column GraphView (left) - Network visualization (1000x850px)
  - 4-column SARPanel (right) - Compliance recommendation
  - Full-width RiskScorePanel - Relationship risk details
  - Full-width TransactionExplainer - Data source documentation
- **Features**:
  - Error handling with Bootstrap alerts
  - Loading states with spinners
  - Back navigation button
  - Responsive layout with minimal spacing

#### 4. **GraphView Component** (`GraphView.jsx`)
Interactive force-directed network graph visualization.
- **Node Features** (14px radius):
  - Color-coded by role: 🔴 Gatekeeper (Red), 🟠 Mule (Orange), 🟣 UBO (Purple), 🔵 Default (Blue)
  - Displays entity labels with underscores as spaces
  - Represents accounts/entities in the network

- **Edge Features**:
  - **Width**: 3.5px base + (risk_score × 6) multiplier for visual risk indication
  - **Color**: 🔴 Red (high risk >0.6), 🟠 Orange (medium 0.3-0.6), 🔵 Blue (low <0.3)
  - **Direction**: 12px arrows showing transaction flow direction
  - **Labels**: Shows transaction relation type, amount in GBP, and risk score

- **Interactivity**:
  - Pan and zoom capabilities for deep exploration
  - Tooltips on hover showing entity type and ID
  - Dynamic sizing based on composite risk scores
  - Force-directed simulation for organic positioning

- **Technical Details**:
  - Canvas-based rendering for high performance
  - Custom node and link drawing logic
  - Memoized score map for efficient lookups
  - Responsive dimensions: 1000x850px (configurable)

#### 5. **SARPanel Component** (`SARPanel.jsx`)
Displays Suspicious Activity Report (SAR) filing recommendation - the core compliance decision.
- **Classification Types**:
  - 🚨 **SAR Filing Required** (Red Alert #e63946): High-risk activity requiring immediate SAR filing with regulatory authorities
  - ⚠️ **Enhanced Due Diligence** (Yellow Alert #f4a261): Requires additional investigation and monitoring
  - ✅ **No Action Required** (Green Alert #2a9d8f): Transaction passes compliance checks

- **Data Displayed**:
  - Classification status with emoji and alert text
  - Detailed rationale explaining the decision
  - Risk indicators dictionary with specific findings (pattern analysis, flags, anomalies)

- **UI**: Bootstrap alert component styling with color-coded backgrounds and borders

#### 6. **RiskScorePanel Component** (`RiskScorePanel.jsx`)
Detailed breakdown of relationship risk scores for all edges.
- **Features**:
  - Sorted list of edges by risk score (highest first)
  - Bootstrap list-group styling for clean presentation
  - Score badges with dynamic color:
    - 🔴 Red badge: High risk (>0.6)
    - 🟡 Yellow badge: Medium risk (0.3-0.6)
    - 🔵 Blue badge: Low risk (<0.3)
  - Entity relationships with transaction types and amounts (formatted with commas)
  - Risk reasons (bullet list) explaining scoring factors

- **Purpose**: Provides detailed justification for each relationship's risk assessment

#### 7. **TransactionToGraphExplainer Component** (`TransactionToGraphExplainer.jsx`)
Educational component explaining graph construction from transactional data.
- **Layout**:
  - **Left Section (5 cols)**: Raw transaction table
    - Columns: Source | Destination | Amount | Type
    - Bootstrap table-sm styling
    - Shows all transactions from source data

  - **Center**: Arrow Indicator (→) showing transformation

  - **Right Section (5 cols)**: Graph structure explanation
    - Displays node count (accounts/entities)
    - Displays edge count (directed transactions)
    - Explains benefits: cycle detection, shortest-path analysis, density clustering

- **Purpose**: 
  - Educates users on how transaction data becomes network graph
  - Explains graph benefits over flat tables
  - Provides data provenance and transparency

#### 8. **Footer Component** (`Footer.jsx`)
Application footer with copyright and legal information.
- **Features**:
  - Framework description section
  - Dynamic copyright year (auto-updates)
  - Privacy policy links
  - Professional dark styling (matches header)

- **Content**:
  - Left: Application name and description
  - Right: Copyright © [Year] Delta Team
  - Attribution and privacy information

#### 9. **ScenarioCard Component** (`ScenarioCard.jsx`)
Individual scenario card for homepage display.
- **Features**:
  - Mini force-directed graph preview (400x280px)
  - Scenario title and description
  - Clickable navigation to detail page
  - Bootstrap card with shadow effects
  - Hover effects (shadow-lg on hover)

- **Purpose**: Quick scenario preview and navigation

---

## 📊 Data Flow & Analysis Process

### 1. **Transaction Data Input**
Raw transactional ledger containing:
- Source entity
- Destination entity
- Transaction amount (£)
- Transaction type/relationship

### 2. **Graph Construction**
- **Nodes**: Unique entities extracted from source and destination fields
- **Edges**: Each transaction becomes a directed edge with attributes
- **Weighting**: Edges weighted by transaction amount
- **Result**: Directed graph structure for relationship analysis

### 3. **Role Analysis**
System identifies and flags:
- **Ultimate Beneficiary Owners (UBO)**: Final beneficial owners (🟣 Purple nodes)
- **Gatekeepers**: Suspicious intermediaries (🔴 Red nodes)
- **Mules**: Money movement facilitators (🟠 Orange nodes)
- **Normal Entities**: Regular counterparties (🔵 Blue nodes)

### 4. **Risk Scoring**
Composite risk calculation for each edge considers:
- **Network Topology**: Cycles, intermediaries, connectivity degree
- **Pattern Analysis**: Unusual amounts, frequency anomalies, timing patterns
- **Entity Risk**: Role classification, historical patterns, industry
- **Relationship Type**: Expected vs. actual transaction types

**Scoring Range**: 0.0 (Low Risk) → 1.0 (High Risk)

### 5. **SAR Determination**
Based on composite analysis results:

```
IF (max_edge_score > 0.7 OR multiple_high_risk_edges) THEN
  → 🚨 SAR Filing Required

ELSE IF (0.4 < avg_score < 0.7 OR suspicious_patterns) THEN
  → ⚠️ Enhanced Due Diligence

ELSE IF (avg_score < 0.4 AND no_red_flags) THEN
  → ✅ No Action Required
```

---

## 🎨 UI/UX Features

### Bootstrap Integration
- **Responsive Grid System**: 12-column layout adapting to all screen sizes
- **Dark Header/Footer**: Professional dark-bg branding
- **Light Content Area**: bg-light for readability
- **Component Library**: Cards, alerts, badges, tables for consistency

### Accessibility
- Semantic HTML5 markup
- ARIA labels for screen readers
- Keyboard navigation support
- Color-coded with text labels (not color-only indicators)

### Visual Enhancements
- **Color Coding**: Risk levels (Red → Orange → Blue) and entity roles
- **Shadows & Spacing**: Modern card layout with 48px padding around graphs
- **Large Interactive Elements**: 14px nodes, 3.5px+ edges, 12px arrows
- **Loading States**: Bootstrap spinner indicators for async operations

---

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- npm 6+

### Installation

```bash
cd frontend
npm install
```

### Running the Application

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder

---

## 📡 API Integration

Backend API provides:
- `GET /api/scenarios` - All available scenarios
- `GET /api/scenarios/{id}/sar-report` - SAR recommendation
- `GET /api/scenarios/{id}/graph` - Network graph structure
- `GET /api/scenarios/{id}/relationship-scores` - Edge risk scores

---

## 🔒 Security & Compliance

- Sensitive transaction data handled securely
- SAR determinations follow FinCEN guidelines
- Audit-ready recommendations with detailed reasoning
- Role-based entity classification for pattern detection
- Supports AML/KYC compliance requirements

---

## 📈 Use Cases

### 1. Green Financing Loan Assessment
Evaluate companies applying for green financing; assess network risk

### 2. Compliance Monitoring
Ongoing monitoring to detect suspicious pattern changes

### 3. Due Diligence Enhancement
Quick analysis of transaction scenarios

### 4. Regulatory Reporting
Data-driven SAR filing decisions with visual justification

### 5. Transaction Pattern Analysis
Identify layering schemes and high-risk relationships

---

## 📚 Technology Stack

- **React 19.2.7**: Modern UI with hooks and concurrent rendering
- **React Router DOM 7.18.1**: Client-side routing
- **Bootstrap 5.3.2**: Responsive CSS framework
- **react-force-graph-2d 1.29.1**: WebGL-based graph visualization
- **Axios 1.18.1**: HTTP client
- **React Scripts 5.0.1**: Build tools

---

## 👥 Team

**Copyright © 2024 Delta Team**

All rights reserved.

---
 
## 🌍 Environmental Impact

By supporting **Green Financing** loans through rigorous AI-powered financial analysis, this framework:
- ✅ Enables funding for sustainable and environmentally responsible projects
- ✅ Reduces fraud risk in green energy sector
- ✅ Supports compliance for climate-focused investments
- ✅ Accelerates global sustainability initiatives

---

**Network Intelligence Framework for Green Financing** - Empowering Financial Institutions with AI-Driven Risk Analysis 🌱
