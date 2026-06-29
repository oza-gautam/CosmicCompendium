# Task: Establish Consistent Scientific Terminology Across the Application

You are a Senior UX Writer, Product Designer, and Senior Software Engineer.

Your task is to perform a terminology audit and update **all user-facing labels, buttons, headings, menus, dialogs, tooltips, breadcrumbs, notifications, and status messages** throughout the application.

This is **not** a visual redesign.

This is **not** a workflow redesign.

This task is focused entirely on establishing a consistent scientific vocabulary.

---

# Product Context

This application is **Disinfection ICT Workbench**.

It is used by laboratory scientists and water/wastewater treatment engineers to:

* Create benchmark studies
* Load laboratory workbooks
* Organize experimental runs
* Calibrate Integrated Contact Time (ICT) models
* Compare model fits
* Generate engineering reports

The application should sound like scientific software—not generic business software.

Users are conducting scientific studies, not managing files.

---

# Goal

Create a consistent domain language throughout the application.

Every screen should reinforce the same scientific mental model.

Users should feel they are working inside a laboratory modeling environment.

---

# Terminology Principles

Prefer scientific terminology over generic software terminology.

Think like a laboratory scientist.

Avoid words commonly found in CRUD applications, document management systems, or cloud storage applications.

---

# Standard Terminology

## Study

Replace:

Project

Projects

Project Details

Project List

Project Dashboard

With:

Benchmark Study

Benchmark Studies

Study Details

Study Library

Study Workspace

Use **Benchmark Study** consistently throughout the application.

---

## Sample

Replace generic "Sample" terminology where it represents an imported experiment.

Preferred:

Experimental Run

Laboratory Run

Experimental Dataset (only when referring specifically to the data itself)

Examples:

Sample 1

↓

Experimental Run 1

Sample Details

↓

Experimental Run Details

Select Sample

↓

Select Experimental Run

---

## Upload

The user uploads a file only once.

After that, they are adding scientific observations to a study.

Examples:

Upload CSV

↓

Add Experimental Run

Upload Data

↓

Add Laboratory Data

Upload Another File

↓

Add Another Experimental Run

---

## Import

Replace "Import" when it refers to creating scientific content.

Examples:

Import Excel

↓

Load Laboratory Workbook

Review & Import

↓

Create Benchmark Study

Import Successful

↓

Benchmark Study Created

Import Complete

↓

Laboratory Data Loaded

Use **Load** when referring to opening an existing workbook.

Use **Create** when referring to creating a study.

---

## Model Fitting

Replace engineering jargon with scientific terminology.

Examples:

Fit Model

↓

Calibrate Model

Fit Pooled

↓

Calibrate ICT Model

Run Fit

↓

Run Calibration

Auto Fit

↓

Automatic Calibration

Fitting

↓

Calibration

Fit Results

↓

Calibration Results

Previous Fits

↓

Calibration History

---

## Reports

Replace:

Export

with more descriptive actions where appropriate.

Examples:

Download Report

↓

Generate Engineering Report

Export Results

↓

Export Calibration Results

Export Parameters

↓

Export Estimated Parameters

---

## Navigation

Current

Projects

↓

Benchmark Studies

Current

Project

↓

Study

Current

Home

↓

Workbench

---

## Workflow

Current

Upload

↓

Load Workbook

Current

Map Columns

↓

Map Scientific Variables

Current

Review

↓

Review Benchmark Study

Current

Finish

↓

Create Benchmark Study

---

## Statistics

Maintain scientific terminology.

Examples:

Fit Quality

Calibration Quality

Estimated Parameters

Model Diagnostics

Regression Summary

Convergence

Information Criteria

Residual Analysis

Observed vs Predicted

These are already scientifically appropriate and should remain.

---

## Buttons

Prefer action-oriented scientific language.

Examples:

New Project

↓

New Benchmark Study

Continue

↓

Continue Analysis

Open

↓

Open Study

Fit

↓

Calibrate

Run

↓

Run Calibration

Import

↓

Load Workbook

Upload CSV

↓

Add Experimental Run

---

## Empty States

Avoid generic wording.

Example:

No Projects

↓

No Benchmark Studies

No Samples

↓

No Experimental Runs

Upload your first file

↓

Load your first laboratory workbook

---

## Notifications

Replace generic software notifications.

Examples:

File uploaded successfully

↓

Laboratory workbook loaded successfully

Import complete

↓

Benchmark study created successfully

Model fit completed

↓

ICT model calibration completed

---

# Terminology Rules

Use one term consistently.

Never alternate between:

Project / Study

Fit / Calibration

Sample / Experimental Run

Import / Load

Choose one preferred term and use it everywhere.

Consistency is more important than variety.

---

# Technical Requirements

1. Audit every visible string in the application.

2. Update:

* Buttons
* Navigation
* Dialogs
* Modals
* Empty states
* Tooltips
* Notifications
* Breadcrumbs
* Page titles
* Context menus
* Status messages

3. Centralize terminology into a shared constants or localization file (for example, `labels.ts`, `copy.ts`, or an i18n resource) so future wording changes can be made in one place.

4. Do not hardcode duplicate labels across components.

---

# Success Criteria

After completing this task, the application should read like professional scientific software.

A laboratory scientist should never feel they are interacting with a generic file management application.

Every screen should reinforce the same mental model:

**Users create Benchmark Studies, load Laboratory Workbooks, organize Experimental Runs, calibrate ICT models, review Calibration Results, and generate Engineering Reports.**

The application should have a single, coherent scientific vocabulary from the first screen to the final report.
