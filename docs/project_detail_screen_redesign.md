# Task: Redesign the Study Detail Screen

You are a Senior UX Designer, Product Designer, and Senior Frontend Engineer.

Your task is to redesign **ONLY the Project Detail (Study Detail) screen**.

Maintain the same visual language established throughout the application:

* Scientific
* Minimal
* Information rich
* Engineering focused
* Dark/Light themes
* Professional desktop application

Do not redesign the application's workflows.

Do not modify backend APIs.

Do not change any scientific functionality.

---

# Product Context

This is **Disinfection ICT Workbench**.

Each project represents a **Benchmark Study**.

Each study contains one or more laboratory sample datasets.

Users arrive here immediately after creating or importing a study.

This page prepares the user for model fitting.

The goal is to answer one question:

> **"What experimental data belongs to this study, and what should I analyze next?"**

---

# Design Philosophy

This is not a file browser.

It is a **Study Workspace**.

Scientists should feel they are looking at a laboratory notebook rather than a folder of CSV files.

---

# Overall Layout

```
──────────────────────────────────────────────

Header

Logo

Study Breadcrumb

Theme Toggle

──────────────────────────────────────────────

Study Overview

Study Name

Description

Created

Last Modified

Number of Samples

Primary Actions

──────────────────────────────────────────────

LEFT

Study Information

CENTER

Experimental Runs

RIGHT

Study Summary

Quick Actions

Recent Activity

──────────────────────────────────────────────
```

---

# Header

Use the application logo.

```
Disinfection ICT Workbench
```

The study breadcrumb becomes:

Projects

HRSD

instead of large page titles.

---

# Study Overview

Replace the current tiny title.

Create a compact workspace header.

Example:

```
HRSD Benchmark Study

4 Experimental Runs

Created Jun 27, 2026

Last Updated Today
```

Below this place action buttons:

New Sample

Import Excel

Upload CSV

Start Model Calibration

The buttons should feel like workflow actions instead of file upload actions.

---

# Left Sidebar

Create a narrow Study Information panel.

Sections:

Study Metadata

Utility

Disinfectant

Created

Owner

Notes

Tags

Future:

Study Status

Draft

Ready for Analysis

Archived

---

# Center Workspace

This is the primary area.

Rename:

Samples

to

Experimental Runs

or

Laboratory Runs

Each card represents one experiment.

Cards should resemble laboratory notebook entries.

---

# Study Card

Each card should include:

Sample Name

Observation Count

Disinfectant

Date Collected

Data Quality

Model Status

Last Modified

Continue Analysis →

Hover state

Entire card clickable

Future placeholder:

Tiny sparkline showing microbial decay.

This creates immediate visual identity.

---

Example

```
────────────────────────

Sample 6

Run 1

PAA

6 observations

Ready for Calibration

Imported Yesterday

Continue Analysis →

────────────────────────
```

---

# Card Status

Use subtle badges.

Imported

Validated

Needs Review

Calibrated

Analysis Complete

Regression Failed

Avoid bright colors.

---

# Right Sidebar

Instead of empty whitespace create a contextual workspace.

Sections:

Study Summary

Experimental Runs

Total Observations

Imported Files

Models Completed

Quick Actions

Import Data

Generate Sample

Documentation

Recent Activity

CSV Imported

Excel Imported

Sample Created

Calibration Completed

---

# Workspace Summary

Small metrics.

Example

```
Studies

1

Experimental Runs

4

Observations

21

Calibrated

0

Pending

4
```

---

# Empty State

If no samples exist:

Display the ICT logo icon.

Headline

No Experimental Runs

Supporting text

Import laboratory data to begin Integrated Contact Time modeling.

Buttons

Upload CSV

Import Excel

Open Sample Dataset

---

# Visual Hierarchy

The Study Name should be the largest element.

Experimental Runs should dominate the page.

Action buttons should appear immediately below the study title.

Secondary metadata should remain visually quiet.

---

# Terminology

Avoid generic software language.

Prefer:

Benchmark Study

Experimental Run

Laboratory Run

Observation

Calibration

Analysis

Validation

Model

Dataset

instead of

Project

Files

Items

Resources

Objects

---

# Scientific Identity

The application logo should reinforce the scientific nature of the software.

Use the horizontal logo in the navigation header.

Use the circular icon for:

Empty states

Loading screens

Study placeholder

Small branding accents

The decay curve from the logo may inspire subtle section dividers and decorative elements.

---

# Micro-interactions

Cards

Lift 3px on hover

Action buttons

Soft highlight

Badges

Gentle fade

Transitions

150–200ms

No excessive animation.

---

# Light & Dark Mode

Both themes should feel like first-class experiences.

Dark Mode

Deep navy backgrounds

Scientific blue highlights

Muted borders

Light Mode

White background

Light gray cards

Deep navy typography

Blue accents

Maintain identical layouts between themes.

---

# Technical Constraints

Frontend

Next.js 16

React 18

TypeScript

Tailwind CSS

Keep components modular.

Suggested structure:

```
components/study/

StudyHeader.tsx

StudyOverview.tsx

StudySidebar.tsx

ExperimentalRunGrid.tsx

ExperimentalRunCard.tsx

WorkspaceSummary.tsx

RecentActivity.tsx

QuickActions.tsx

EmptyStudy.tsx
```

Reuse existing APIs.

Do not modify backend behavior.

---

# Success Criteria

This page should no longer feel like a page containing uploaded CSV files.

Instead, it should feel like opening a laboratory notebook for a benchmark study.

A scientist should immediately understand:

• What this study is about

• How many experimental runs exist

• Which runs are ready for analysis

• Which action should happen next

• The current health and progress of the study

The overall impression should be:

**"A professional scientific workspace for organizing laboratory benchmark studies before model calibration."**
