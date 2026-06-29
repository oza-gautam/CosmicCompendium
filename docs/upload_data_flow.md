# Task: Redesign the Import Data Wizard

You are a Senior UX Designer and Senior Frontend Engineer.

Your task is to redesign **ONLY the Import Data workflow**.

Do **not** change the workflow logic.

Do **not** modify backend APIs.

Do **not** change validation logic.

Do **not** change the four-step import process.

Your objective is to transform the wizard into a polished scientific workflow that matches the rest of the **Disinfection ICT Workbench**.

---

# Product

Disinfection ICT Workbench

Laboratory scientists use this wizard to import experimental datasets before calibrating Integrated Contact Time (ICT) models.

This is the first scientific interaction users have with the application.

It should feel trustworthy, elegant and engineered.

---

# Overall Theme

Continue the existing application theme.

Dark Mode

Deep Navy

Scientific Blue

Cyan accents

Light Mode

White

Cool Gray

Scientific Blue accents

Maintain identical layouts.

The attached application logo establishes the design language.

Use it consistently.

---

# Design Philosophy

This is NOT a file upload dialog.

This is an **Import Laboratory Data Wizard**.

The interface should communicate:

Laboratory Data

Experimental Runs

Scientific Validation

Engineering Workflow

Every step should reassure the user that their data is being prepared for model calibration.

---

# Wizard Layout

Instead of a plain modal, create a professional workspace.

```
──────────────────────────────────────────────

Logo

Import Laboratory Dataset

Benchmark Study: HRSD

Step 1 of 4

──────────────────────────────────────────────

Progress

Upload

Select Worksheets

Map Columns

Review & Import

──────────────────────────────────────────────

Main Workspace

──────────────────────────────────────────────

Footer

Previous

Next

Cancel

──────────────────────────────────────────────
```

The wizard should feel like an application page, not a popup.

---

# Header

Use the application icon.

Title:

Import Laboratory Dataset

Subtitle:

Prepare experimental observations for Integrated Contact Time modeling.

The subtitle reinforces the scientific purpose.

---

# Step Indicator

Replace the existing circles with a cleaner workflow.

Example

```
Upload
──────▶
Worksheets
──────▶
Column Mapping
──────▶
Review
```

Completed steps receive:

✓

Current step uses the application's Scientific Blue.

Future steps remain muted.

---

# Upload Workspace

The upload area should become the hero.

Increase vertical space.

Center it.

Introduce a subtle illustration inspired by the application logo.

Ideas:

ICT curve outline

Scientific graph

Laboratory notebook

Do NOT use stock upload illustrations.

---

# Drop Zone

Current:

Large empty rectangle.

Replace with a polished panel.

```
────────────────────────────

⬆

Drop Excel Workbook Here

or

Browse Files

Supports

.xlsx

.xlsm

Maximum

100 MB

────────────────────────────
```

Hover state:

Soft blue border

Background glow

Subtle animation

---

# Import Tips

Below the upload area display:

Accepted columns

Time

Concentration

CFU

Optional Metadata

This immediately reassures users that the application understands scientific data.

---

# Sample Workbook

Add a secondary action.

Download Sample Workbook

Scientists love examples.

---

# Right Sidebar

Instead of empty whitespace create a contextual helper panel.

Sections:

Import Requirements

Supported Formats

Expected Columns

Common Validation Errors

Helpful Tips

Example:

✔ Time values should be numeric.

✔ Concentration units should be consistent.

✔ CFU values should be positive.

This reduces import failures.

---

# Footer

Large navigation.

Cancel

Previous

Next

The primary button should always communicate the next scientific action.

Examples:

Select Worksheets

Review Mapping

Begin Import

instead of simply "Next."

---

# Step 2

Worksheet Selection

Instead of a table.

Display workbook sheets as cards.

```
Workbook

HRSD_June.xlsx

────────────────────

Sample 1

32 rows

Import

────────────────────

Sample 2

18 rows

Import

────────────────────
```

Allow multi-select.

---

# Step 3

Column Mapping

This is where visual polish matters.

Show two columns.

```
Excel Column

↓

Application Field

```

Use dropdowns with icons.

Time

⏱

Concentration

🧪

CFU

📈

Show green checkmarks as mappings become valid.

Display a live preview table beneath.

---

# Step 4

Review

Present a professional import summary.

```
Workbook

HRSD_June.xlsx

Experimental Runs

4

Observations

342

Mapped Columns

3

Validation

Passed

Ready for Import
```

Use a success card.

Large green indicator.

Display exactly what will be imported.

---

# Visual Identity

The logo establishes the application's personality.

Echo its visual language subtly.

Examples:

Thin wave divider

ICT curve watermark

Rounded engineering cards

Scientific Blue accents

Do not decorate excessively.

---

# Empty Space

The current wizard has enormous unused space.

Replace that with:

Helpful guidance

Data previews

Import summaries

Scientific tips

Validation status

Every area should have purpose.

---

# Micro-interactions

Drop Zone

Soft glow on drag-over

Cards

2–3px lift

Buttons

150ms transition

Step indicator

Animated progress

Validation

Green check animation

No excessive animation.

---

# Typography

Strong hierarchy.

Title

32px

Step

18px

Section Titles

16px

Descriptions

14px

Metadata

12px

Everything should feel engineered and easy to scan.

---

# Components

Refactor into reusable components.

Suggested structure

```
components/import/

ImportWizard.tsx

ImportHeader.tsx

ProgressStepper.tsx

UploadWorkspace.tsx

WorksheetSelector.tsx

ColumnMapper.tsx

ReviewSummary.tsx

ValidationSidebar.tsx

ImportFooter.tsx
```

---

# Success Criteria

The redesigned wizard should no longer feel like uploading a spreadsheet.

Instead, it should feel like preparing laboratory observations for scientific analysis.

By the time the user clicks **Import**, they should feel confident that:

• Their experimental data has been validated.

• The application understands the laboratory dataset.

• The next step is model calibration.

The overall experience should communicate:

**"Your laboratory data is now ready for Integrated Contact Time modeling."**
