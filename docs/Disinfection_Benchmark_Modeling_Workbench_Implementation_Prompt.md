# Prompt: Build the Disinfection Benchmark Modeling Workbench

You are a senior software architect, UX designer, data scientist, and
scientific computing engineer.

## Mission

Build a production-quality scientific web application for benchmark
disinfection studies.

The application must:

1.  Import benchmark CSV datasets.
2.  Compute Integrated Contact Time (ICT).
3.  Fit microbial inactivation models.
4.  Compare competing models.
5.  Produce publication-quality figures.
6.  Generate transparent scientific reports.

## Technology

### Frontend

-   Next.js
-   React
-   TypeScript
-   TailwindCSS
-   shadcn/ui
-   Plotly.js

### Backend

-   FastAPI
-   NumPy
-   Pandas
-   SciPy
-   StatsModels

### Database

SQLite

## User Workflow

1.  Create Project
2.  Upload Samples
3.  Validate Data
4.  Calculate ICT
5.  Select Model
6.  Fit Model
7.  Review Diagnostics
8.  Compute Model Quality Score
9.  Generate Charts
10. Export Report

## Model Registry

Implement a plugin architecture.

Each model exposes:

-   Name
-   Description
-   Equation
-   Parameters
-   Bounds
-   Initial guesses
-   Fit function
-   Predict function

## Initial Models

-   Traditional CT
-   First-order ICT
-   Chick-Watson
-   Hom
-   Weibull
-   Biphasic
-   Two-Population ICT Model

## Interactive Parameter Explorer

Provide sliders for all parameters.

Update curves live.

Allow optimization using nonlinear least squares.

## Model Quality Score

Create a transparent scoring engine (0--100).

Evaluate:

### Data Quality

-   Observation count
-   Replicate consistency
-   ICT coverage
-   Missing values
-   Outliers

### Optimization Quality

-   Convergence
-   Iterations
-   Hessian conditioning
-   Covariance quality

### Statistical Quality

-   R²
-   RMSE
-   MAE
-   AIC
-   BIC
-   Residual randomness

### Scientific Quality

-   Parameter plausibility
-   Confidence interval width
-   Parameter identifiability
-   Parameter correlation
-   Overfitting risk

Every deduction must be explained.

Output:

-   Score
-   Rating
-   Strengths
-   Weaknesses
-   Recommendations

## Diagnostics

Provide:

-   Residual vs ICT
-   QQ Plot
-   Histogram
-   Cook's Distance
-   Leverage
-   Correlation heatmap

## Visualization

Publication-quality:

-   Scatter plots
-   Model fits
-   Confidence bands
-   Prediction bands
-   Multi-sample overlays
-   PNG/SVG/PDF export

## Reporting

Generate PDF, HTML, and DOCX reports including:

-   Dataset summary
-   ICT calculations
-   Model equations
-   Parameter estimates
-   Diagnostics
-   Figures
-   Model Quality Score
-   Scientific interpretation

## Design Principles

-   Scientific accuracy first
-   Reproducible workflows
-   Extensible architecture
-   Publication-quality output
-   Modern, intuitive UX
