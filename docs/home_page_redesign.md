# Task: Redesign the Home Page into a Scientific Workbench

You are a Senior UX Designer, Product Designer, and Senior React Engineer.

Your task is to redesign **ONLY the Home Page** of the application.

Do **not** modify any workflows, routes, backend APIs, or scientific functionality unless absolutely necessary to support the new UI.

This is **commercial scientific software**, not a marketing website or CRUD application.

The application is called:

# **Disinfection ICT Workbench**

The attached logo set is now the official design language for the application.

The home page should be designed around this identity.

---

# Application Context

The Disinfection ICT Workbench is used by water and wastewater treatment engineers and laboratory scientists to:

* Create benchmark studies
* Import laboratory datasets
* Fit Integrated Contact Time (ICT) models
* Perform nonlinear regression
* Validate microbial inactivation models
* Export engineering reports

Users spend hours inside the application performing scientific analysis.

The application should feel like opening MATLAB, OriginPro, COMSOL, or AspenTech—not a project management tool.

---

# Design Philosophy

The application should feel like a **Scientific Workbench**.

A scientist should immediately understand:

* What studies are active
* Which datasets need attention
* Which models have been calibrated
* What work was recently completed
* What to do next

The interface should communicate:

* Precision
* Engineering
* Mathematical modeling
* Scientific computation
* Laboratory analysis

---

# Logo Usage

Use the attached logos throughout the redesign.

## Header

Use the horizontal logo (icon + wordmark).

This should become the application's identity.

Do not use plain text for the application title.

The logo should occupy approximately 220–280 px width and establish a strong visual anchor.

---

## Sidebar / Favicon

Use the square icon version where appropriate.

---

## Color Palette

The UI should inherit the logo colors.

Primary Background

Deep Navy

Primary Accent

Scientific Blue

Secondary Accent

Cyan

Neutral

Cool grays

Avoid introducing additional accent colors.

The logo should feel integrated into the UI rather than pasted onto it.

---

# Layout

The home page should resemble an engineering workbench.

```
------------------------------------------------------------

Header

Logo

Search

Theme Toggle

------------------------------------------------------------

WELCOME

Disinfection ICT Workbench

Continue your scientific modeling work.

[ New Benchmark Study ]

Import Dataset

------------------------------------------------------------

MAIN WORKBENCH

LEFT (70%)

Active Studies

Study Cards

------------------------------------------------------------

RIGHT (30%)

Quick Actions

Workspace Summary

Recent Activity

Helpful Resources

------------------------------------------------------------
```

The page should immediately communicate activity rather than displaying empty space.

---

# Welcome Section

Instead of a generic "Projects" heading, create a compact workspace introduction.

Example:

Disinfection ICT Workbench

Scientific Modeling Environment

Continue your laboratory benchmarking and kinetic model analysis.

This section should use the logo prominently.

Do not create a large marketing hero.

Keep it compact and professional.

---

# Active Studies

This replaces the existing project list.

Each study card should feel like a laboratory notebook.

Include:

Study Name

Utility

Disinfectant

Model

Status

Sample Count

Last Modified

Continue Analysis

Hover elevation

Rounded corners

Thin borders

Large project title

Subtle typography hierarchy

Optional future enhancement:

Reserve space for a miniature Plotly sparkline showing the fitted decay curve.

---

# Workspace Summary

Instead of meaningless project counts, show engineering metrics.

Examples:

Studies

Models Calibrated

Regression Success Rate

Reports Generated

Pending Calibration

Initially these can use placeholder values.

The components should be reusable.

---

# Recent Activity

Display a vertical timeline.

Examples:

Dataset Imported

Regression Completed

Model Validated

Report Exported

Study Created

Icons should be simple outline icons.

Use relative timestamps.

---

# Quick Actions

New Benchmark Study

Import Dataset

Open Sample Study

Documentation

These should be prominent but restrained.

---

# Empty State

If no studies exist:

Display the logo icon prominently.

Headline:

No Benchmark Studies Yet

Supporting text:

Create your first study to begin importing laboratory data and calibrating Integrated Contact Time models.

Buttons:

New Benchmark Study

Import Sample Dataset

This should feel polished and intentional.

---

# Visual Language

The logo establishes the application's personality.

Use that language consistently.

The decay curve from the logo may subtly inspire dividers, section accents, or empty-state illustrations.

The water wave motif may be echoed very subtly in separators or background graphics.

Do **not** copy the logo repeatedly.

Use restrained visual references.

---

# Micro-interactions

Study cards

Lift 2–4 px on hover

Buttons

Subtle brightness transition

Status badges

Small colored indicator dot

Transitions

150–200 ms

No flashy animations.

---

# Technical Constraints

Frontend

Next.js 16

React 18

TypeScript

Tailwind CSS

Plotly.js

Do not introduce another UI framework.

Keep components modular.

Suggested structure:

```
components/workbench/

WorkbenchHeader.tsx
WelcomePanel.tsx
ActiveStudies.tsx
StudyCard.tsx
WorkspaceSummary.tsx
QuickActions.tsx
RecentActivity.tsx
EmptyWorkbench.tsx
```

Reuse existing project APIs.

Do not modify backend behavior.

---

# Success Criteria

The redesigned home page should feel like opening a professional engineering application.

The logo should establish a strong product identity, while the layout should reinforce the idea of a scientific workbench.

A laboratory scientist should immediately understand:

* This is software for scientific modeling.
* My current studies are front and center.
* My next actions are obvious.
* The application feels purposeful, information-rich, and built for engineering—not generic project management.

The overall impression should be:

**"A modern scientific modeling environment for Integrated Contact Time analysis."**
