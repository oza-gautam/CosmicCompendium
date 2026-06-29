# Task: Redesign the Analysis Workspace (Final Results Screen)

You are a Senior UX Designer, Product Designer, and Senior Frontend Engineer specializing in scientific and engineering software.

Your task is to redesign **ONLY the final analysis screen** shown in the attached screenshot.

This is the final screen of a 3–4 step scientific workflow.

Do not change the scientific calculations, backend APIs, model fitting logic, regression algorithms, or data structures.

This task is purely about creating a world-class scientific user experience.

---

# Application

Disinfection ICT Workbench

This application is used by water treatment engineers and laboratory scientists to calibrate Integrated Contact Time (ICT) disinfection models from experimental datasets.

The application performs nonlinear regression and produces engineering-quality model diagnostics.

The attached logo is the official branding.

Use it as inspiration for the overall visual language.

The application supports both Dark Mode and Light Mode.

The UI must look exceptional in both.

---

# Design Goal

The current screen feels like a dashboard assembled from independent cards.

Instead, redesign it to feel like a professional scientific analysis environment similar to:

• MATLAB

• OriginPro

• JMP

• GraphPad Prism

• COMSOL

• AspenTech

• Bloomberg Terminal (information density)

The user should immediately understand:

> **The chart is the primary artifact. Everything else exists to explain, validate, and support that chart.**

---

# Primary Design Principle

Hierarchy.

The importance of each region should be:

1. Model Visualization
2. Scientific Interpretation
3. Model Controls
4. Supporting Statistics

Everything should reinforce this order.

---

# Visual Identity

Use the attached logo throughout the application.

Header:

Use the horizontal logo.

The logo establishes the product identity.

Do not simply display text.

The logo should replace the current application title.

The logo colors become the application's accent colors.

Scientific Blue

Deep Navy

Cyan

Maintain a restrained engineering aesthetic.

---

# Layout

Reorganize the interface into a proper scientific workspace.

```
---------------------------------------------------------------------------------

Header

Logo

Study Name

Sample Selector

Fit Button

Export Report

Theme Toggle

---------------------------------------------------------------------------------

LEFT SIDEBAR

Study

Model

Parameters

Samples

Fit History

---------------------------------------------------------------------------------

CENTER

Large Plot

Tabs

Plot

Residuals

Observed vs Predicted

Calculated N

Journal

Equation

---------------------------------------------------------------------------------

RIGHT SIDEBAR

Model Quality

Fit Statistics

Estimated Parameters

Confidence Intervals

Convergence

Diagnostics

Warnings

---------------------------------------------------------------------------------
```

The chart should dominate the screen.

Everything else supports the chart.

---

# Chart Area

Increase the visual importance of the chart.

The chart should occupy approximately 60–70% of the workspace.

Increase whitespace around the axes.

Improve typography.

Use cleaner legends.

Improve annotation placement.

The fitted equation should become a polished equation panel beneath the graph rather than appearing like a footer.

Future-ready:

Reserve room for:

Confidence bands

Prediction intervals

Residual overlays

Interactive point inspection

---

# Left Sidebar

Think of this as the scientist's notebook.

Sections:

Study Information

Model Selection

Parameter Mode

Estimated Parameters

Sample Library

Previous Fits

The sidebar should feel organized into collapsible sections.

Use subtle section separators.

Allow the current study to remain visually anchored.

---

# Right Sidebar

This should become the "Scientific Summary."

Instead of many equal-sized cards, organize information into logical groups.

## Model Quality

Large R²

RMSE

Adjusted R²

Convergence Status

Color-coded quality indicator.

---

## Information Criteria

AIC

BIC

Likelihood

---

## Estimated Parameters

Parameter

Estimate

Standard Error

Confidence Interval

Future-ready for:

Coefficient of Variation

Parameter correlation

Sensitivity

---

## Diagnostics

Converged

Degrees of Freedom

Observations

Warnings

Residual Normality

Future statistical tests

---

# Fit Quality Indicator

Instead of simply showing numbers:

Create a scientific quality badge.

Example:

Excellent Fit

R² = 0.998

Converged

12 Observations

Green indicator

Think like an engineering report.

---

# Scientific Language

Avoid generic UI wording.

Prefer:

Study

Calibration

Analysis

Validation

Fit Quality

Estimated Parameters

Model Diagnostics

Regression Summary

Benchmark Study

instead of generic software terminology.

---

# Color System

Dark Mode

Deep Navy background

Blue accents

Cyan highlights

Muted grays

Light Mode

Clean white background

Very light gray cards

Deep Navy text

Scientific Blue accents

Both themes should feel equally polished.

---

# Micro-interactions

Cards

Very slight hover elevation

Buttons

Soft transition

Tabs

Animated underline

Status indicators

Gentle color transitions

No flashy animations.

---

# Responsive Behavior

Large Desktop

Three-column engineering workspace.

Laptop

Compress sidebars.

Tablet

Right panel collapses into tabs.

Mobile

Read-only analysis mode.

---

# Accessibility

Maintain WCAG AA.

Keyboard navigation.

Focus states.

Color-independent status indicators.

---

# Technical Constraints

Frontend

Next.js 16

React 18

TypeScript

Tailwind CSS

Plotly.js

Do not replace Plotly.

Do not introduce another UI framework.

Refactor into reusable components.

Suggested structure:

components/analysis/

AnalysisWorkspace.tsx

AnalysisHeader.tsx

ModelSidebar.tsx

PlotWorkspace.tsx

ScientificSummary.tsx

ParameterTable.tsx

FitQualityCard.tsx

DiagnosticsPanel.tsx

EquationPanel.tsx

StudyNavigator.tsx

ThemeToggle.tsx

Use composition.

Keep components modular.

---

# Logo Integration

Use the attached logo as part of the application's identity.

Do not overuse it.

Place it prominently in the header.

The circular icon may also be used subtly for:

Loading state

Empty state

Application icon

About dialog

The logo's decay curve and wave motif should inspire subtle UI details such as dividers, section headers, and loading animations.

---

# Overall Impression

When a scientist opens this screen, it should feel like opening a premium scientific modeling application—not a web dashboard.

The chart should command attention.

The side panels should feel like a laboratory notebook and an engineering report.

The interface should communicate precision, trust, and analytical rigor.

The user should immediately feel confident that they are working in a professional Integrated Contact Time modeling environment suitable for research, regulatory review, and engineering decision-making.
